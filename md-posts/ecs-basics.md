---
title: ECS Basics
date: '2021-02-06'
description: 'Deploy tutorial site to Amazon ECS - Elastic Container Service'
keyword: 'ECS, Elastic Container Service, ECR, Elastic Container Registry, Docker, CircleCI'
order: 5
---

Amazon ECS - Elastic Container Service - is a fully managed container (Docker) orchestration service.

Amazon ECR - Elastic Container Registry - is a fully managed container registry that makes it easy to store, manage, share, and deploy your container images and artifacts anywhere.

We are going to take the Docker image create in [Build Docker Image](/posts/build-docker-image) and update our **circleci** config to deploy it to Amazon Elastic Container Service (ECS) via Amazon Elastic Container Registry (ECR). Hopefully!!!!

**1) Configure CircleCI environment variables**

Going to need a number of env vars to access AWS services from inside **circleci**

- **AWS_ACCESS_KEY_ID** - Security credentials for AWS.

- **AWS_SECRET_ACCESS_KEY** - Security credentials for AWS.

- **AWS_DEFAULT_REGION** - default region we will create resources in.

- **AWS_ACCOUNT_ID** - Required for deployment.

- **AWS_ECR_ACCOUNT_URL** - Amazon ECR account URL that maps to an AWS account, e.g. {AWS_ACCOUNT_ID}.dkr.ecr.{AWS_DEFAULT_REGION}.amazonaws.com

Will create a **circleci** context so these can be used in multiple projects if needed, call it **aws-context**

In **AWS Console** go to **IAM** and create a new user, for now give them programmatic access to ECS and ECR and download the credential file.

Create a ECR repo in AWS console - {AWS_ACCOUNT_ID}.dkr.ecr.{AWS_DEFAULT_REGION}.amazonaws.com/tutorial-site-registry

We can now build and push our Docker image to AWS ECR if you need to learn how to create docker images take a look at [Build Docker Image](/posts/build-docker-image) tutorial. In the created repo click on the View push commands button and follow the instructions to get your image up to the repos.

Going to use the **circleci** [ecr orb](https://circleci.com/developer/orbs/orb/circleci/aws-ecr) in our `config.yml` file

Add just under the `version: 2.1` line:

```
version: 2.1

orbs:
  aws-ecr: circleci/aws-ecr@6.15.3
```

Add this to pull_request workflow for testing, will move over to build later when confirmed it works:

```
- aws-ecr/build-and-push-image:
    <<: *only_on_pr_branch
    context: aws-context
    repo: tutorial-site-registry
    region: AWS_DEFAULT_REGION
    tag: "latest"
    requires:
      - unit_tests
      - run_lint
```

We can then push our PR up to see it work.

Instead of signing into AWS and creating the ECR in the console we could have use terraform to create one.

```
provider "aws" {
  region = "your chosen aws region"
}

resource "aws_ecr_repository" "tutorial_site_repo" {
  name = "tutorial-site-registry"
}
```

Then run

`terraform apply` as I have **awscli** set up I can access aws services.

We will use **Terraform** to build out ECS infrastructure.

Lets run throught the files we will use:

**main.tf**

```
provider "aws" {
  region = var.aws_region
}
```

We need to tell terraform which provider we are using i.e we are creating something in AWS.

**versions.tf**

```
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
  required_version = ">= 0.14"
}
```

Tell what version of Terraform to use and what providers are needed.

**ecs.tf** 

This is our main file. ECS is made out of clusters, services, and tasks

Tasks - describe how a container should be run
Services - runs a specified number of tasks, adding new ones and removing them as required
Clusters - logical grouping of services and tasks

We start with the Cluster:

```
resource "aws_ecs_cluster" "main_cluster" {
  name = "${var.prefix}-cluster"
}
```

The prefix will ensure consistent naming and will be in our variables.tf file `tutorial-site`.

Next we add a task:

```
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.prefix}-task" # name the task
  requires_compatibilities = ["FARGATE"]          # Stating that we are using ECS Fargate
  network_mode             = "awsvpc"             # Using awsvpc as our network mode as this is required for Fargate
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn # see roles.tf for IAM setup
  container_definitions    = <<DEFINITION
  [
    {
      "name": "${var.prefix}-app",
      "image": "${var.app_image}",
      "cpu": ${var.fargate_cpu},
      "memory": ${var.fargate_memory},
      "networkMode": "awsvpc",
      "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "/ecs/${var.prefix}-app",
            "awslogs-region": "${var.aws_region}",
            "awslogs-stream-prefix": "ecs"
          }
      },
      "portMappings": [
        {
          "containerPort": ${var.app_port},
          "hostPort": ${var.app_port}
        }
      ]
    }
  ]
  DEFINITION
}
```

There is a lot here but essentially we are assigning our Doicker image we put in our ECR repo, port binding for container & host (3000), merory & CPU requirements and ensuring it has the correct IAM permissions to exacute.

We are using AWS **Fargete**. ECS comes in 2 flavours, Classic where we use EC2 instances that we have to provision or we can use **Fargete** that is serverless. We don't have to worry about provisioning any EC2 instances AWS looks after it all for us.

Then we create the service:

```
resource "aws_ecs_service" "main_service" {
  name            = "${var.prefix}-service"
  cluster         = aws_ecs_cluster.main_cluster.id # Referencing our created Cluster
  task_definition = aws_ecs_task_definition.app.arn # Referencing the task our service will spin up
  desired_count   = var.app_count                   # Setting the number of containers we want deployed
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.private.*.id
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "${var.prefix}-app"
    container_port   = var.app_port
  }

  depends_on = [aws_alb_listener.front_end, aws_iam_role_policy_attachment.ecs_task_execution_role]
}
```
Define how many tasks should run and how they should be run. For this we are doing just one (for learning, but in real app you'd have more). We also set up network config (security groups and subnets) and a load balancer.

So to ensure the above works we need to fill in the gaps.

**roles.tf**

Set up the IAM roles to allow our task to exacute:

```
# Create an IAM role so that tasks have the correct permissions to execute
# ECS task execution role data
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "${var.prefix}-EcsTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
}

# ECS task execution role
data "aws_iam_policy_document" "ecs_task_execution_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ECS task execution role policy attachment
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
```

**networks.tf**

Set the network config:

```
# Fetch AZs in the current region
data "aws_availability_zones" "available" {
}

resource "aws_vpc" "main" {
  cidr_block = "172.17.0.0/16"
}

# Create var.az_count private subnets, each in a different AZ
resource "aws_subnet" "private" {
  count             = var.az_count
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  vpc_id            = aws_vpc.main.id
}

# Create var.az_count public subnets, each in a different AZ
resource "aws_subnet" "public" {
  count                   = var.az_count
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, var.az_count + count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  vpc_id                  = aws_vpc.main.id
  map_public_ip_on_launch = true
}

# Internet Gateway for the public subnet
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
}

# Route the public subnet traffic through the IGW
resource "aws_route" "internet_access" {
  route_table_id         = aws_vpc.main.main_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.gw.id
}

# Create a NAT gateway with an Elastic IP for each private subnet to get internet connectivity
resource "aws_eip" "gw" {
  count      = var.az_count
  vpc        = true
  depends_on = [aws_internet_gateway.gw]
}

resource "aws_nat_gateway" "gw" {
  count         = var.az_count
  subnet_id     = element(aws_subnet.public.*.id, count.index)
  allocation_id = element(aws_eip.gw.*.id, count.index)
}

# Create a new route table for the private subnets, make it route non-local traffic through the NAT gateway to the internet
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = element(aws_nat_gateway.gw.*.id, count.index)
  }
}

# Explicitly associate the newly created route tables to the private subnets (so they don't default to the main route table)
resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = element(aws_subnet.private.*.id, count.index)
  route_table_id = element(aws_route_table.private.*.id, count.index)
}
```

**lb.tf**

Set up our load balancer so traffic is distubuted across our containers (we only have one so this is a little pointless but if you add more):

```
resource "aws_alb" "main" {
  name            = "${var.prefix}-load-balancer"
  subnets         = aws_subnet.public.*.id
  security_groups = [aws_security_group.lb.id]
}

resource "aws_alb_target_group" "app" {
  name        = "${var.prefix}-target-group"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "3"
    path                = var.health_check_path
    unhealthy_threshold = "2"
  }
}

# Redirect all traffic from the ALB to the target group
resource "aws_alb_listener" "front_end" {
  load_balancer_arn = aws_alb.main.id
  port              = var.app_port
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_alb_target_group.app.id
    type             = "forward"
  }
}
```

**security.tf**

Ensure our site is secure only getting the traffic we want (at the moment it is from anyone online) and only throught load balancer:

```
resource "aws_alb" "main" {
  name            = "${var.prefix}-load-balancer"
  subnets         = aws_subnet.public.*.id
  security_groups = [aws_security_group.lb.id]
}

resource "aws_alb_target_group" "app" {
  name        = "${var.prefix}-target-group"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "3"
    path                = var.health_check_path
    unhealthy_threshold = "2"
  }
}

# Redirect all traffic from the ALB to the target group
resource "aws_alb_listener" "front_end" {
  load_balancer_arn = aws_alb.main.id
  port              = var.app_port
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_alb_target_group.app.id
    type             = "forward"
  }
}
```

**logs.tf**

Set up CloudWatch group and log stream and retain logs for 30 days:

```
resource "aws_cloudwatch_log_group" "app_log_group" {
  name              = "/ecs/${var.prefix}-app"
  retention_in_days = 30

  tags = {
    Name = "${var.prefix}-log-group"
  }
}

resource "aws_cloudwatch_log_stream" "app_log_stream" {
  name           = "${var.prefix}-log-stream"
  log_group_name = aws_cloudwatch_log_group.app_log_group.name
}
```

**auto_scaling.tf**

If the site gets loads of traffic we want to ensure we have more containers running to handle it and remove them when it drops:

```
resource "aws_appautoscaling_target" "target" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main_cluster.name}/${aws_ecs_service.main_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = 1
  max_capacity       = 3
}

# Automatically scale capacity up by one
resource "aws_appautoscaling_policy" "up" {
  name               = "${var.prefix}_scale_up"
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main_cluster.name}/${aws_ecs_service.main_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Maximum"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 1
    }
  }

  depends_on = [aws_appautoscaling_target.target]
}

# Automatically scale capacity down by one
resource "aws_appautoscaling_policy" "down" {
  name               = "${var.prefix}_scale_down"
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main_cluster.name}/${aws_ecs_service.main_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Maximum"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = -1
    }
  }

  depends_on = [aws_appautoscaling_target.target]
}

# CloudWatch alarm that triggers the autoscaling up policy
resource "aws_cloudwatch_metric_alarm" "service_cpu_high" {
  alarm_name          = "${var.prefix}_cpu_utilization_high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "85"

  dimensions = {
    ClusterName = aws_ecs_cluster.main_cluster.name
    ServiceName = aws_ecs_service.main_service.name
  }

  alarm_actions = [aws_appautoscaling_policy.up.arn]
}

# CloudWatch alarm that triggers the autoscaling down policy
resource "aws_cloudwatch_metric_alarm" "service_cpu_low" {
  alarm_name          = "${var.prefix}_cpu_utilization_low"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "10"

  dimensions = {
    ClusterName = aws_ecs_cluster.main_cluster.name
    ServiceName = aws_ecs_service.main_service.name
  }

  alarm_actions = [aws_appautoscaling_policy.down.arn]
}
```

**variables.tf**

All the variables we have been using:

```
variable "aws_region" {
  description = "The AWS region things are created in"
  default     = "eu-west-1"
}

variable "prefix" {
  description = "prefix name used on resources"
  default     = "tutorial-site"
}

variable "fargate_cpu" {
  description = "Fargate instance CPU units to provision (1 vCPU = 1024 CPU units)"
  default     = "1024"
}

variable "fargate_memory" {
  description = "Fargate instance memory to provision (in MiB)"
  default     = "2048"
}

variable "app_port" {
  description = "Port exposed by the docker image to redirect traffic to"
  default     = 3000
}

variable "app_count" {
  description = "Number of docker containers to run"
  default     = 1 # you would really want more but cost money and ths is just for learning!
}

variable "az_count" {
  description = "Number of AZs to cover in a given region"
  default     = "2"
}

variable "health_check_path" {
  default = "/"
}

variable "account_id" {
  description = "Your aws account if pass in  as env var"
}

variable "app_image" {
  description = "Docker image to run in the ECS cluster"
  default     = "${var.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/tutorial-site-registry:latest"
}
```

With regard to the `app_image` if you had created the ECR using terraform you could get the image details from there `aws_ecr_repository.tutorial_site_repo.repository_url`

**outputs.tf**

Lastly we have the output file:

```
output "alb_hostname" {
  value = aws_alb.main.dns_name
}

output "task_definition" {
  value = aws_ecs_service.main_service.task_definition
}
```

We can get the Load Balancer DNS name from this that will let us see our site - `{aws_alb.main.dns_name}:3000`

Then run

`terraform apply` to build our infrastructure.

Once its up and running go to `{aws_alb.main.dns_name}:3000` to take a look.

To push a new version of our site up to our ECS infrastructure we will use the **circleci** [ecs orb](https://circleci.com/developer/orbs/orb/circleci/aws-ecs)

```
- aws-ecs/deploy-service-update:
  <<: *only_on_pr_branch
  context: aws-context
  aws-region: AWS_DEFAULT_REGION
  family: "tutorial-site-task"
  service-name: "tutorial-site-service"
  cluster-name: "tutorial-site-cluster"
  container-image-name-updates: "container=tutorial-site-app,tag=latest"
  requires:
    - push-to-ecr
```

Finally we should move the ECR and ECS steps from the PR workflow to Build on merge.

ECS does cost money so best to remove it all after if its just for learning:

`terraform destroy`

### **Resourses I uses while setting this all up:**

[https://medium.com/swlh/creating-an-aws-ecs-cluster-of-ec2-instances-with-terraform-85a10b5cfbe3](https://medium.com/swlh/creating-an-aws-ecs-cluster-of-ec2-instances-with-terraform-85a10b5cfbe3)

[https://circleci.com/docs/2.0/ecs-ecr/](https://circleci.com/docs/2.0/ecs-ecr/)

[https://medium.com/avmconsulting-blog/how-to-deploy-a-dockerised-node-js-application-on-aws-ecs-with-terraform-3e6bceb48785](https://medium.com/avmconsulting-blog/how-to-deploy-a-dockerised-node-js-application-on-aws-ecs-with-terraform-3e6bceb48785)