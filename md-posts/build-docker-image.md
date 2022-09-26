---
title: Build Docker Image
date: '2021-01-30'
description: 'Create adocker image of the tutorial site'
keyword: 'Docker, Docker Image'
order: 4
---

Wikipedia - *an open-source project that automates the deployment of software applications inside containers by providing an additional layer of abstraction and automation of OS-level virtualization on Linux*.

In other words **Docker** allows you to package an application with all of its dependencies into a standardized unit (Container) that ensure it runs consitently where ever it is deployed.

**Image**: The blueprints of our application which form the basis of containers
**Container**: Created from Docker images and run the actual application 

I'm going to create a Docker file with this tutorial site in, which can them be used later when learning AWS (ECS & EKS)

Need [Docker Desktop installed](https://www.docker.com/products/docker-desktop)
Best to do get [started guide](https://docs.docker.com/get-started/)

Basic commands

`docker pull <image-name>` This will pull down image form Docker Hub

`docker images` list images

`docker run <image-name>` run container based on image

`docker run --help` see list of flags it supports

`docker ps` list of running container

`docker ps -a` list of all run containers

`docker rm <container-id> <container-id>` delete containers

`docker rm $(docker ps -a -q -f status=exited)` or `docker container prune` delete all exited containers `--rm` flag with docker run will deleted on exit

`docker rmi <imag-id or name>` delete image

`docker build Dockerfile .` for building images based on dockerfile

Create image containing our tutorial site (**Next.js app**)

**Dockerfile:** simple text file that contains a list of commands that the Docker client calls while creating an image

```
# base image needed to run node application
FROM node:alpine

# set a directory for the app
WORKDIR /app

RUN yarn install

# copy source files
COPY . /app

# run next build step
RUN yarn build

# expose port 3000
EXPOSE 3000

# set run command
CMD yarn start
```

Add a **.dockerignore** file to stop certain files being added to our image

```
**/Dockerfile
**/.dockerignore
**/.gitignore
**/.git
**/README.md
**/CHANGELOG.md
**/.vscode
```

Build our image with:

`docker build -t tutorial-site -f Dockerfile .`

The image is tagged as tutorial-site. This creates an image with the size of 350MB.

Can now test it works with:

`docker run -i -p 3000:3000 -t tutorial-site:latest` 

This starts the docker container on port 3000 you can go to [localhost:3000](http://localhost:3000/) to try it.

If you run `docker images` you will see it give you an image that is **350MB** lets see if we can reduct this.

```
# base image needed to run node application
FROM node:alpine as BUILD_IMAGE

# set a directory for the app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# copy source files
COPY . .

# run next build step
RUN yarn build

#  remove dev dependencies
RUN npm prune --production

FROM node:alpine

# set a directory for the app
WORKDIR /app

# copy from build image
COPY --from=BUILD_IMAGE /app/package.json ./package.json
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /app/.next ./.next
COPY --from=BUILD_IMAGE /app/public ./public

# expose port 3000
EXPOSE 3000

# set run command
CMD yarn start
```

Once build this give an image of **237MB**