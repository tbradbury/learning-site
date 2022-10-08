---
title: Learning Kubernetes
date: '2021-09-05'
description: 'Run site in a local Kubernetes cluster'
keyword: 'Kubernetes, API, Docker'
order: 8
---

To get a better understanding of kubernetes we are going to deploy our tutorial site to a local Kubernetes cluster. We will then add a basic api that can be only access from with in the cluster by the site.

## Local Kubernetes cluster

We have a couple of options for this, one is **[Minikube](https://minikube.sigs.k8s.io/docs/start/)**. We will however be using **[Docker Desktops](https://www.docker.com/products/docker-desktop)** built in Kubernetes cluster, you  just need to turn it on in the preferences.

We have already put our tutorial-site into a docker image. See [Build Docker Image](/posts/build-docker-image).

To deploy and run this image in our local Kubernetes cluster we need to give it a version number. We can do this in 2 ways.

1) If we already have the image create we can tag it `docker tag local-tutorial-site movie-api:1.0.0`
2) We can build it again with tag `docker build -t local-tutorial-site:1.0.0 .`

I'm going to create a new folder called `local-ts-kube` and cd into it. Here we will put all the kubernetes resource definition YAML files that will tell our cluster what we are deploying and how they should be set up. We will start with a `local.yaml` for a tutorial-site app:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: local-tutorial-site
  labels:
    app: local-tutorial-site
spec:
  replicas: 1
  selector:
    matchLabels:
      app: local-tutorial-site
  template:
    metadata:
      labels:
        app: local-tutorial-site
    spec:
      containers:
        - name: tutorial-site
          image: local-tutorial-site:1.0.0
          ports:
            - containerPort: 3000
          imagePullPolicy: Never
---
apiVersion: v1
kind: Service
metadata:
  name: local-tutorial-site-service
spec:
  selector:
    app: local-tutorial-site
  ports:
    - port: 3000
      targetPort: 3000
  type: LoadBalancer
```

The file has 2 part a **Deployment** and a **Service**. 

The Deployment creates and runs containers/pods and keeps them alive i.e takes our image and deploys and runs in in our cluster. The first 4 lines tell us it a deployment using version type apps/v1 and that it's name is local-tutorial-site. We then state the number of replicas of the pod we want. So here we have 1 replica of out tutorial-site image. So hight trafic sites can have mutiple replicas of the same site that uses a load balancer to distabute traffic to. The selector and template sections tie the deployment resourse to the replica set. Then the container section defines what will actually run in the pod/s, out local-tutorial-site image along with the portt the container will listen on. Note we have set the imagePullPolicy to never, as our image is currently stored locally not in a repo like Docker Hub. This ensure we pull the local version.

We then define the Service. A Service resource makes Pods accessible to other Pods or users outside the cluster. Without defining our servise as type **LoadBalancer** it would not be accessible from outside the cluster, Default type is **ClusterIP**. The selector defines what is doing to be exposed by the service `app: local-tutorial-site` this matches what we set in the Deployment. Ports set that the service will listen for requests on port 3000 and forward them to port 3000 of the target pod/s i.e send traffic to our site.

We can now deploy our service to our local cluster using `kubectl apply -f ./local.yaml` we can then check if its been suseful in a number of ways. see pods - `kubectl get pods` or check services `kubectl describe services`. If you go to [http://localhost:3000](http://localhost:3000) you will see your site as normal but it's ruinning in your local Kubernetes cluster.

## Add an api service

Lets say we want a movie page on our site that lists the top 100 files of all time. For this we will create a really basic api server that can return that information to be ingested by our site.

In a new folder (seperate from out tutorial site) `mkdir fake-api` we will start a new project `npm init -y` in its package.json file we will add one dependency and one command:

```
{
  "name": "fake-api",
  "version": "1.0.0",
  "description": "basic api to practice using in k8",
  "main": "index.js",
  "scripts": {
    "start": "json-server --watch src/index.js"
  },
  "author": "Tim Bradbury",
  "license": "ISC",
  "devDependencies": {},
  "type": "commonjs",
  "dependencies": {
    "json-server": "^0.16.3"
  }
}
```

Here we are using the json-server npm package to create a simple and easy api. 

src/index.js:

```
const movies = require('./bds/movies')

module.exports = () => ({ movies })
```

/src/bds/movies.js

```
const movies = [
  {
    "title": "The Shawshank Redemption",
    "rank": "1",
    "id": "tt0111161"
  },
  {
    "title": "The Godfather",
    "rank": "2",
    "id": "tt0068646"
  },
  ...
]

module.exports = movies
```

json-server.json:

```
{
  "host": "0.0.0.0",
  "port": 4000,
}
```

If you then run `yarn start` you will get a api running on http://0.0.0.0/4000. localhost should also work but we need it as 0.0.0.0 to work in Kubernetes.

Now we just beed to turn it into an image with a Dockerfile:

```
FROM node:12.18-buster

WORKDIR /app

COPY . .

EXPOSE 4000

ENTRYPOINT ["node", "./node_modules/.bin/json-server", "src/index.js"]
```

Which can be built with `docker build -t movie-api:1.0.0 .`

Back in `local-ts-kube` we need a new resource for this `touch api.yaml`:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: local-movie-api
  labels:
    app: local-movie-api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: local-movie-api
  template:
    metadata:
      labels:
        app: local-movie-api
    spec:
      containers:
        - name: movie-api
          image: movie-api:1.0.0
          ports:
            - containerPort: 4000
          imagePullPolicy: Never
---
apiVersion: v1
kind: Service
metadata:
  name: local-movie-api-service
spec:
  selector:
    app: local-movie-api
  ports:
    - port: 4000
      targetPort: 4000
```

This is basically the same as the tutorial-site resource but with differnt ports and we have not defined the service type. This means it will be set as the default **ClusterIP**. So Our api will not be available outside our cluster just to pods inside it.

We can then deploy it to our cluster `kubectl apply -f ./api.yaml`

## Update our tutorial site

We need to update or tutorial site to use the api:

pages/movis.tsx:

```
import React from 'react';
import axios from 'axios';

const Movies = ({ movies }) => (
  <>
    {movies.map(({ title, id, rank }) => (
      <h2 key={id}>{`${rank}) ${title}`}</h2>
    ))}
  </>
);

export async function getServerSideProps(context) {
  try {
    const response = await axios.get(process.env.MOVIE_API_URL);
    return {
      props: {
        movies: response.data,
      },
    };
  } catch (error) {
    console.error(error);
  }

  return {
    props: {
      movies: [],
    },
  };
}

export default Movies;
```

Here we are using **axios** to make a call to our api endpoint that we are storing in a env var. With this we can rebuild our image:

`docker tag local-tutorial-site movie-api:1.1.0`

And update our **local.yaml** file:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: local-tutorial-site
  labels:
    app: local-tutorial-site
spec:
  replicas: 1
  selector:
    matchLabels:
      app: local-tutorial-site
  template:
    metadata:
      labels:
        app: local-tutorial-site
    spec:
      containers:
        - name: tutorial-site
          image: local-tutorial-site:1.1.0
          ports:
            - containerPort: 3000
          env:
            - name: MOVIE_API_URL
              value: http://local-movie-api-service:4000/movies
          imagePullPolicy: Never
---
apiVersion: v1
kind: Service
metadata:
  name: local-tutorial-site-service
spec:
  selector:
    app: local-tutorial-site
  ports:
    - port: 3000
      targetPort: 3000
  type: LoadBalancer
```

Here we are doing to important things we are updating the image tag and adding the env var to the api. Notice that the env var is not to `http:0.0.0.0:4000/movies` but to `http://local-movie-api-service:4000/movies`. This is the service name we gave our api this connects our site app to the api service inside out the cluster.

We can then redeploy our app `kubectl apply -f ./local.yaml` and go to `http://localhost:3000/movies` and see our movies!

To remove our resources we would do:

`kubectl delete -f ./local.yaml`
`kubectl delete -f ./api.yaml`

To get into container  you can do the following:

`kubectl get pods`

Then with the pod name you can then call:

`kubectl exec {pod-name-here} -it -- /bin/sh`

https://learnk8s.io/deploying-nodejs-kubernetes

We could also use **Helm** to setup our app, as we did in (EKS Basics)[/posts/eks-basics/].

**local-tutorial-site/Chart.ymal**

```
apiVersion: v2
name: local-tutorial-site
description: A Helm chart for Kubernetes

type: application

version: 0.1.0

appVersion: 1.16.0
```

**local-tutorial-site/values.ymal**

```
# Default values for app-chart.
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.

replicaCount: 1

image:
  repository: local-tutorial-site
  repositoryName: tutorial-site
  pullPolicy: Never
  # Overrides the image tag whose default is the chart appVersion.
  tag: 1.3.0
envs:
  MOVIE_API_URL: 'http://local-movie-api-service:4000/movies'
service:
  name: LoadBalancer
  type: LoadBalancer
  containerPort: 3000
  servicePort: 3000
```

**local-tutorial-site/templates/deployment.ymal**

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: "{{  .Chart.Name }}"
  labels:
    app: "{{  .Chart.Name }}"
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
        - name: "{{ .Values.image.repositoryName }}"
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.containerPort}}
          env:
          {{- range $key, $val := .Values.envs }}
            - name: {{ $key }}
              value: {{ $val | quote }}
          {{- end }}
          imagePullPolicy: "{{ .Values.image.pullPolicy }}"
```

**local-tutorial-site/templates/service.ymal**

```
apiVersion: v1
kind: Service
metadata:
  name: "{{  .Chart.Name }}-service"
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.containerPort }}
      targetPort: {{ .Values.service.servicePort }}
  selector:
    name: "{{  .Chart.Name }}"
```

**local-movie-api/Chart.ymal**

```
apiVersion: v2
name: local-movie-api
description: A Helm chart for Kubernetes

type: application

version: 0.1.0

appVersion: 1.16.0
```

**local-movie-api/values.ymal**

```
replicaCount: 1

image:
  repository: movie-api
  repositoryName: movie-api
  pullPolicy: Never
  # Overrides the image tag whose default is the chart appVersion.
  tag: 1.0.0
service:
  name: ClusterIP
  type: ClusterIP
  containerPort: 4000
  servicePort: 4000
```

**local-movie-api/templates/deployment.ymal**

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: "{{  .Chart.Name }}"
  labels:
    app: "{{  .Chart.Name }}"
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
        - name: "{{ .Values.image.repositoryName }}"
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.containerPort}}
          imagePullPolicy: "{{ .Values.image.pullPolicy }}"
```

**local-movie-api/templates/service.ymal**

```
apiVersion: v1
kind: Service
metadata:
  name: "{{  .Chart.Name }}-service"
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.containerPort }}
      targetPort: {{ .Values.service.servicePort }}
  selector:
    name: "{{  .Chart.Name }}"
```

To deploy your app with Helm you then just run:

`helm install local-tutorial-site ./local-tutorial-site`

`helm install local-movie-api ./local-movie-api`

To remove them:

`helm uninstall local-tutorial-site`

`helm uninstall local-movie-api`

add the `--dry-run` flag to test before running actions.