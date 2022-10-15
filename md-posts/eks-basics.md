---
title: EKS Basics
date: '2021-02-15'
description: 'Deploy tutorial site to EKS - Elastic Kubernetes Service'
keyword: 'EKS, Elastic Kubernetes Service, Kubernetes, kubectl, CircleCI'
order: 6
---

In the last blog we looked at [ECS](/posts/ecs-basics) a fully managed container (Docker) orchestration service. However this is not our only option. In this blog we will look to deploy our site on **EKS - Elastic Kubernetes Service**

According to the [Kubernetes site](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/):

"Kubernetes is a portable, extensible, open-source platform for managing containerized workloads and services, that facilitates both declarative configuration and automation. It has a large, rapidly growing ecosystem. Kubernetes services, support, and tools are widely available." 

It other words its an orchestration service for our containers. Its repidly become a popular industry standard.

Start by going thought [Kubernetes basic tutorial](https://kubernetes.io/docs/tutorials/kubernetes-basics/) to undertand the basics.

**Kubernetes Cluster** manages your containers. Consists of two types of resources:

- The **Master** coordinates the cluster
- **Nodes** are the workers that run applications. Each node has a Kubelet, which is an agent for managing the node and communicating with the Kubernetes master.

Userful commands

- kubectl cluster-info - gives you info on the Cluster
- kubectl get nodes - gives info on nodes running on Cluster

**Kubernetes Deployments** to deploy your contanerized apps to **Kubernetes** you need a Deployment configuration. You specify the container image you want to run and how many replicas of the image you want. 

**Deployment Controller** monitors deployed instances of apps. If something goes wrong with the node hosting the app, a new node is created with new instance of the app on.

- kubectl create deployment deployment-name --image=url-to-image:v1

**Kubernetes Pods** host your application instance inside a **node**. **Nodes** can run multiple **pods**.

- kubectl get pods - list pods
- kubectl descride pods - describes pods
- kubectl logs $POD_NAME - gets logs from names pod, if you had more then one node you would need to add node name as well.
- kubectl exec -ti $POD_NAME bash -  exec some cammand on pod here its bash

**Kubernetes Services** an abstraction which defines a logical set of Pods and a policy by which to access them. Enables you to expose your app to the outside world.

- kubectl get services - see list of services
- kubectl expose deployment/<name-of-service> --type="NodePort" --port 8080 - created new service that exposes app to outside world

- kubectl get deployments - list deployments
- kubectl get rs - list replica sets
- kubectl scale deployments/<name-of-service> --replicas=4 - up pods to 4

Rolling deploys

- kubectl set image deployments/<name-of-service> <name-of-service>=<image-name>:v2 - deploy new image
- kubectl rollout undo deployments/<name-of-service> - revert

We will use **Terraform** to build out EKS infrastructure.

**main.tf**

```
provider "aws" {
  region = var.aws_region
}

locals {
  cluster_name = "${var.prefix}-cluster"
}
```

We need to tell terraform which provider we are using i.e we are creating something in AWS. We are also setting up a local value so we can set our cluster name.

**versions.tf**

```
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }

    kubernetes = {
      source = "hashicorp/kubernetes"
    }

    local = {
      source = "hashicorp/local"
    }
  }
}
```

Tell what version of Terraform to use and what providers are needed.

**vpc.tf**

```
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "2.66.0"

  name                 = "${local.cluster_name}-vpc"
  cidr                 = "10.0.0.0/16"
  azs                  = data.aws_availability_zones.available.names
  private_subnets      = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets       = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }
}
```

Provisions a VPC, subnets (3 private and three public) and availability zones using the AWS VPC Module. It also adds tags, used to provision public and internal load balancers in the appropriate subnets.

**security-groups.tf**

```
resource "aws_security_group" "worker_group_one" {
  name_prefix = "worker_group_one"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port = 22
    to_port   = 22
    protocol  = "tcp"

    cidr_blocks = [
      "10.0.0.0/8",
    ]
  }
}

resource "aws_security_group" "all_worker" {
  name_prefix = "all_worker_management"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port = 22
    to_port   = 22
    protocol  = "tcp"

    cidr_blocks = [
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.0.0/16",
    ]
  }
}
```

Provisions the security groups used by the EKS cluster.

**eks.tf**

```
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = local.cluster_name
  cluster_version = "1.18"
  subnets         = module.vpc.private_subnets // custer will deploy on private subnet

  vpc_id = module.vpc.vpc_id

  workers_group_defaults = {
    root_volume_type = "gp2"
  }

  worker_groups = [
    {
      name                          = "${var.prefix}-app-worker-group"
      instance_type                 = "t2.micro"
      asg_desired_capacity          = 2
      asg_max_size                  = 3
      asg_min_capacity              = 1
      additional_security_group_ids = [aws_security_group.worker_group_one.id]
    }
  ]

  map_users = var.map_users

  write_kubeconfig   = true
  config_output_path = "./"
}

data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_id
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_id
}
```

Provisions all the resources required to set up an EKS cluster using the AWS EKS Module.

- Creates Kubernetes control plane
- AutoScaling Groups
- security groups added to workers
- Creates kubeconfig file
- adds additional IAM users to Cluster. When you create the Cluster with Terraform the users your using to access AWS with **awscli** will automaticlay be added to the Cluster so you they have access to the cluster. But we will want to make changes to this from our CI workflow. If your using the same IAM credetials (not recommended) this will be fine. If your using a seperate user their IAM ARN value needs adding to the [aws-auth ConfigMap](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html) `map_users = var.map_users` will sort this.

**kubernetes.tf**

```
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
  exec {
    api_version = "client.authentication.k8s.io/v1alpha1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      data.aws_eks_cluster.cluster.name
    ]
  }
}
```

The Kubernetes provider is included in this file so the EKS module can complete successfully.

**outputs.tf**

```
output "cluster_id" {
  description = "EKS cluster ID."
  value       = module.eks.cluster_id
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane."
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane."
  value       = module.eks.cluster_security_group_id
}

output "kubectl_config" {
  description = "kubectl config as generated by the module."
  value       = module.eks.kubeconfig
}

output "config_map_aws_auth" {
  description = "A kubernetes configuration to authenticate to this EKS cluster."
  value       = module.eks.config_map_aws_auth
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = local.cluster_name
}
```

Defines the output configuration.

**variables.tf**

```
variable "aws_region" {
  description = "The AWS region things are created in"
  default     = "eu-west-1"
}

variable "prefix" {
  description = "prefix name used on resources"
  default     = "tutorial-site"
}

variable "map_users" {
  description = "Additional IAM users to add to the aws-auth configmap."
  type = list(object({
    userarn  = string
    username = string
    groups   = list(string)
  }))

  default = [
    {
      userarn  = "arn:aws:iam::XXXXXXXX:user/circleci-accessor"
      username = "circleci-accessor"
      groups   = ["system:masters"]
    },
  ]
}
```

Variables used in config. The XXXXXXXX in the IAM userarn should be replaced with your account number and correct user.

You can now run:

`terraform plan` to see what will be created in AWS and if your happy you can run:
`terraform apply` and type yes to create your Cluster.

This will take about 10 to 20 mins to complete. AWS EKS does cost money so be sure to remove everything once done if your just using it to test - `terraform destroy`

Once this is done you have a Cluster create but how do you access it. **Terraform** will have created a `kubeconfig_{cluster-name}` file as part fo the build process.

Export this to a environmental veriable `export KUBECONFIG=/path/to/{cluster-name}` you can then run commands against your Cluster:

`kubectl get pods --all-namespaces`

So you have a cluster but you dont have anything on it. As we did in the [ECS](/ecs-basics) tutorial we will use a image of the site from ECR that we will then add to our Cluster.

Create a ECR repo in AWS console - {AWS_ACCOUNT_ID}.dkr.ecr.{AWS_DEFAULT_REGION}.amazonaws.com/tutorial-site-registry

We can now build and push our Docker image to AWS ECR if you need to learn how to create docker images take a look at [Build Docker Image](/build-docker-image) tutorial. In the created repo click on the View push commands button and follow the instructions to get your image up to the repos.

So how are we going to get our Image in ECR into our EKS Cluster? To acheive this we will use **Helm**

**Helm** describes itself as the package mananger for **Kubernetes**. It helps define, install and upgrade even the most complex Kubernetes apps. Helm allows us to package our app along with all of the config it needs, into a **Chart**. The Helm Chart then describes how our app should be deployed and run.

You will need Helm installed on your computer [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/)

We can then create a Helm chart either by running `helm create chart-folder-name` or just create a folder and create the following files:

**chart-folder-name/Chart.ymal**

```
apiVersion: v2
name: tutorial-site
description: A Helm chart for Kubernetes of tutorial-site app

# A chart can be either an 'application' or a 'library' chart.
#
# Application charts are a collection of templates that can be packaged into versioned archives
# to be deployed.
#
# Library charts provide useful utilities or functions for the chart developer. They're included as
# a dependency of application charts to inject those utilities and functions into the rendering
# pipeline. Library charts do not define any templates and therefore cannot be deployed.
type: application

# This is the chart version. This version number should be incremented each time you make changes
# to the chart and its templates, including the app version.
# Versions are expected to follow Semantic Versioning (https://semver.org/)
version: 0.1.0

# This is the version number of the application being deployed. This version number should be
# incremented each time you make changes to the application. Versions are not expected to
# follow Semantic Versioning. They should reflect the version the application is using.
appVersion: 1.5.0
```

**chart-folder-name/values.ymal**

```
# Default values for app-chart.
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.

replicaCount: 1

image:
  repositoryURL: xxxxxxxxxxx.dkr.ecr.eu-west-1.amazonaws.com
  repositoryName: tutorial-site-registry
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: latest
service:
  name: LoadBalancer
  type: LoadBalancer
  containerPort: 80
  servicePort: 3000
```

Again the xxxxxxxxxxx should be replaced with your AWS account ID.

**chart-folder-name/templates/deployment.ymal**

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: "{{  .Chart.Name }}"
spec:
  replicas: {{ .Values.replicaCount }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      name: "{{  .Chart.Name }}"
  template:
    metadata:
      labels:
        name: "{{  .Chart.Name }}"
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repositoryURL }}/{{ .Values.image.repositoryName }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.servicePort}}
```

This will deploy your Image ion your ECR repo to your cluster.

**chart-folder-name/templates/service.ymal**

```
apiVersion: v1
kind: Service
metadata:
  name: "{{  .Chart.Name }}"
spec:
  type: LoadBalancer
  ports:
    - port: {{ .Values.service.containerPort }}
      targetPort: {{ .Values.service.servicePort }}
  selector:
    name: "{{  .Chart.Name }}"
```

This will hook up your deployed app to a AWS load balancer so you can access it from the outside world.

You can now run `helm install tutorial-site ./app-chart` and your app will be deployed to your Cluster.

2 ways to see if it has worked:

`kubectl get pods` note the name of your pod and run `kubectl port-forward tutorial-site-xxxx-xxx 3000:3000` go to localhost:3000 and you will see your app.

But you set up a load balancer so instead run `kubectl describe service tutorial-site` and get he LB url - http://xxxxxxxxxxxxxxxxxxxx-xxxxxxx.eu-west-1.elb.amazonaws.com

To uninstall you can run - `helm uninstall tutorial-site` do this before running `terraform destroy`.

Great you have set up your app in your Cluster and you can access it though LB.

Now we need to intergate it into our CircleCI config so we can update the app when we have changes. As with the [ECS](/ecs-basics) tutorial we will first want to update our ECR image using the circleci/aws-ecr orb.

```
version: 2.1

orbs:
  aws-ecr: circleci/aws-ecr@6.15.3
```

Add this to pull_request workflow for testing, will move over to build later when confirmed it works:

```
- aws-ecr/build-and-push-image:
    <<: *only_on_main_branch
    context: aws-context
    repo: tutorial-site-registry
    region: AWS_DEFAULT_REGION
    tag: "latest"
    requires:
      - unit_tests
      - run_lint
```

After this we will want to update the Image in the Cluster. To acheve this we will need to add 2 more orbs

```
aws-eks: circleci/aws-eks@1.0.3
kubernetes: circleci/kubernetes@0.4.0
```

Then create a custom job. circleci/aws-eks when this was writen had a job to install helm charts but not to upgrade them (which is what we want), plus currently its install helm job is broken.

```
  upgrade-image-in-helm-chart:
    working_directory: ~/project
    executor: aws-eks/python3
    parameters:
      cluster-name:
        description: |
          Name of the EKS cluster
        type: string
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - kubernetes/install
      - aws-eks/update-kubeconfig-with-authenticator:
          cluster-name: << parameters.cluster-name >>
      - run:
          command: |
            curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 > get_helm.sh
            chmod 700 get_helm.sh
            ./get_helm.sh
            helm --help
          name: Test cluster
      - run:
          command: |
            helm upgrade tutorial-site ./infrastructure-eks/app-chart --set image.repositoryURL=${AWS_ECR_ACCOUNT_URL} --set image.tag=${CIRCLE_SHA1}
```

We are using circleci/aws-eks to ensure we can access our cluster. Then we are installing Helm. Once this is complete we are using the Helm upgrade command overriding the repisitoryURL and tag to ensure the lastest version of the app is deployed.

We then add the job after the ECR deploy.

```
- aws-ecr/build-and-push-image:
  <<: *only_on_main_branch
  name: push-to-ecr
  context: aws-context
  repo: tutorial-site-registry
  region: AWS_DEFAULT_REGION
  tag: "${CIRCLE_SHA1}"
  requires:
    - bump_version
- upgrade-image-in-helm-chart:
  <<: *only_on_main_branch
  context: aws-context
  cluster-name: tutorial-site-cluster
  requires:
    - push-to-ecr
```

### **Resourses I uses while setting this all up:**

[https://learnk8s.io/terraform-eks](https://learnk8s.io/terraform-eks)

[https://learn.hashicorp.com/tutorials/terraform/eks](https://learn.hashicorp.com/tutorials/terraform/eks)

[https://aws.amazon.com/blogs/startups/from-zero-to-eks-with-terraform-and-helm/](https://aws.amazon.com/blogs/startups/from-zero-to-eks-with-terraform-and-helm/)

[https://itnext.io/build-an-eks-cluster-with-terraform-d35db8005963](https://itnext.io/build-an-eks-cluster-with-terraform-d35db8005963)

[https://medium.com/dev-genius/create-an-amazon-eks-cluster-with-managed-node-group-using-terraform-a3b50d276b13](https://medium.com/dev-genius/create-an-amazon-eks-cluster-with-managed-node-group-using-terraform-a3b50d276b13)

[https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/deploy/installation/](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/deploy/installation/)

[https://circleci.com/developer/orbs/orb/circleci/aws-eks](https://circleci.com/developer/orbs/orb/circleci/aws-eks)

[https://github.com/CircleCI-Public/circleci-demo-aws-eks/blob/master/.circleci/config.yml](https://github.com/CircleCI-Public/circleci-demo-aws-eks/blob/master/.circleci/config.yml)

[https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html)

[https://boredhacking.com/deploying-to-eks-circleci/](https://boredhacking.com/deploying-to-eks-circleci/)
