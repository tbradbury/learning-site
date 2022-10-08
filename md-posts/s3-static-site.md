---
title: S3 Static Site
date: '2021-04-10'
description: 'Deploy tutorial site as Static website to S3 bucket with Cloudfront'
keyword: 'Static web site, S3, Cloudfront, Certificate Manager'
order: 7
---

In the last two blogs we looked at [ECS](/posts/ecs-basics) and then [EKS](/posts/eks-basics) both provide great ways for use to deploy/host our site. However both solution are a bit over the top for our simple blog site (certainly cost more to run on AWS).

In this blog we deploy our site to an **AWS S3 bucket** and use **Cloudfront** as our content delivery network (CDN).

**1) Make the site static**

The site is made using **Next.js** as you can learn in the [Building a basic site](/posts/basic-site) this is great as **Next** allows you to export your app to static HTML, which can be run standalone without the need of a Node.js server. We just need to use `next export`.

We will add the following to our `pasckage.json` scripts section.

```
"static": "next build && next export",
```

This will create a out/ folder with our static html in.

We also need to change the next.config.js file to ensure our static html plays nice with s3. As it stand our posts will be build as /posts/name-of-post.html. When you have your static site up and runing andf you go from the homepage to this url sitename.com/posts/name-of-post it will be fine and you will see your page, but if you refesh you will get a 404 page not found error / or direct you to homepage depending on your setup. This is due to how AWS handles request to objects in your s3 bucket. 

We need our output to be /posts/name-of-post/index.html. To enable this add:

```
module.exports = {
  trailingSlash: true,
};
```

to the `next.config.js` file.

**2) Create the AWS S3 bucket**

AWS Simple Storage Service or S3 is a object storage service. You can store dataon the cloud, but for our purposes you  can also host a static website there (at an incredably low price).

You can sign into AWS console go to S3 and create your bucket or you can use AWS CLI to do it:

```
aws s3 mb s3://example.co.uk
```

The bucket name must be unique and I am making it the same as the Domain Name I will be using.

**3) Put your static html in the bucket**

In our .circleci/config.yml add:

```
orbs:
  aws-s3: circleci/aws-s3@2.0.0
```

We are using the aws s3 orb to deploy our static site. For this to work CircleCI will need the correct permissions to be able to do this.

We already have the AWS credentials set up in the circle ci context from the [ECS](/posts/ecs-basics) blog

- **AWS_ACCESS_KEY_ID** - Security credentials for AWS.

- **AWS_SECRET_ACCESS_KEY** - Security credentials for AWS.

- **AWS_DEFAULT_REGION** - default region we will create recourse in.

We set up a user for these credentials now we need to go back to IAM and add S3 permissions to the user.

back in .circleci/config.yml we now add a new job

```
build_and_deploy:
    working_directory: ~/project
    executor: node
    parameters:
      argument:
        type: string
        default: '--delete'
    description: add extra arguments to aws s3 commands
    steps:
      - checkout
      - attach_workspace:
          at: ~/project
      - run:
          name: build static
          command: yarn static
      - aws-s3/sync:
          arguments: '<< parameters.argument >>'
          aws-region: AWS_DEFAULT_REGION
          from: ~/project/out
          to: 's3://example.co.uk'
```

This job builds are static html into the out/ file then deploys it to our S3 bucket. The job has a parameter called argument, witha default value of `--delete` this will ensure when we do a new deploy we replace the old fileswith the new one. Alternatively we could keep the old vaules hand have versions (if we need to go backj to an old version, but for now this is fine).

We will add the job to our 2 workflows for our PR branchs we wont deploy but will will confirm the deploy will work by changing out argument param:

```
workflows:
  pull_request:
    jobs:
      - install_deps:
          <<: *only_on_pr_branch
      - unit_tests:
          <<: *only_on_pr_branch
          requires:
            - install_deps
      - run_lint:
          <<: *only_on_pr_branch
          requires:
            - unit_tests
      - build_and_deploy:
          <<: *only_on_pr_branch
          context: aws-context
          argument: '--dryrun'
          requires:
            - run_lint
```

and then on our main branch (merge to main):

```
build:
    jobs:
      - install_deps:
          <<: *only_on_main_branch
      - unit_tests:
          <<: *only_on_main_branch
          requires:
            - install_deps
      - bump_version:
          <<: *only_on_main_branch
          requires:
            - unit_tests
      - build_and_deploy:
          <<: *only_on_main_branch
          context: aws-context
          requires:
            - bump_version
```

**4) configer bucket**

We have our static files in our bucket but we need to change the bucket config to be able to see our site. IN the AWS console we will go to our s3 bucket in the properties section scroll down to the **Static website hosting** section and enable it. We need to spesify a **Index document** for our site in this case index.html. You can also add a error page if you have one. Press save.

You will now be given a url to you static site that looks something like `http://example.co.uk.s3-website-eu-west-1.amazonaws.com/`

But if you try and go to this you will get an error page saying permission denied. You also have to make the bucket public.

Go to permissions and add a bucket policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::example.co.uk/*"
        }
    ]
}
```

This give read access to everyone i.e it will be visiable for internet traffic.

**5) Cloudfront**

You could leave it there you have a static site, but there are a couple of issue, the domain name is not really great for users `http://example.co.uk.s3-website-eu-west-1.amazonaws.com/` plus it http not https.

We can sort he https with **Cloudfront** which gives use the added benifits of a CDN (edge servers closer to users).

Go to **Cloudfront** in AWS console and set up a new distribution (web distribution). 

In the **Origin Domain Name** section you will get a dropdown with your s3 bucket name, but you don't want to use this you need to add instead the s3 bucket static site url `http://example.co.uk.s3-website-eu-west-1.amazonaws.com/`. The4 rest of the setting for now you can leave as is.

Press save and in a few mins your distribution will be deployed and you will have a **Cloudfront** url you can see your site on that will support https `https://randomletters/numers.cloudfront.net`

This is bettewr but still not great, it would be better if we could add our own domain `example.co.uk`.

**5) Certificate Manager with third party domain provider**

Could provide a domain using **Route 52** but I already have a domain with a third party provider.

Go to **Certificate Manager** in the AWS console and click on **Provision certificates** (note to work with **Cloudfront** this needs to be in us-east-1 region regardless of where your s3 bucket or cludfront were set up)

Add your domain choose DNS validation. this will  give you a key/value page that you need to add in your DNS provider console as a CNAME record. This enable AWS to verifiy you have the right to use this domain. Once the domain in **Certificate Manager** has status **issues** you can use your domain in **Cloudfront**.

Back in **Cloudfront** go to the general tab and edit. In **Alternate Domain Names (CNAMEs)** add the domain you validated with **Certificate Manager** then in **SSL Certificate** tick the Custom SSL Certificate (example.com): option add your Certificate from the dropdown and save. Once deployed you will be able to see your site from your domain `https://example.co.uk`

### **Resourses I uses while setting this all up:**

[https://rubenbelow.com/posts/third-party-apex-domain-aws-s3-static-website-routing/](https://rubenbelow.com/posts/third-party-apex-domain-aws-s3-static-website-routing/)

[https://dev.to/namuny/integrating-aws-cloudfront-with-third-party-domain-provider-2ce3](https://dev.to/namuny/integrating-aws-cloudfront-with-third-party-domain-provider-2ce3)

[https://www.freecodecamp.org/news/how-to-host-a-static-website-with-s3-cloudfront-and-route53-7cbb11d4aeea/](https://www.freecodecamp.org/news/how-to-host-a-static-website-with-s3-cloudfront-and-route53-7cbb11d4aeea/)

[https://www.davidbaumgold.com/tutorials/host-static-site-aws-s3-cloudfront/](https://www.davidbaumgold.com/tutorials/host-static-site-aws-s3-cloudfront/)