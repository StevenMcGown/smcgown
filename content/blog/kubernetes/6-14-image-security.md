---
title: K8s 6.14 - Image Security in K8s
date: 2024-06-01T07:07:07
summary: Understanding and Implementing Image Security in Kubernetes Environment
---
We deployed a number of different kinds of pods hosting different kinds of applications throughout this course, like web apps, databases, and Redis cache, etc. Let's start with a simple pod definition file. For instance, here we have used the nginx image to deploy an nginx container. Let's take a closer look at this image name.

nginx-pod.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx
```

The name is "nginx", but what is this image and where is this image pulled from? 
![Security Contexts](/images/kubernetes/diagrams/6-14-1-image-security.png)
This name follows Docker's image naming convention. 
- "**nginx**" here is the image or the repository name. When you say nginx, it's actually library/nginx. 
- The first part stands for the user or the account name. So, if you don't provide a user or account name, it assumes it to be "**library**", which is the name of the default account where Docker's official images are stored. These images promote best practices and are maintained by a dedicated team who are responsible for reviewing and publishing these official images.
	- If you were to create your own account and create your own repositories or images under it, then you would use a similar pattern. So instead of library, it would be your name or your company's name.
- Since we have not specified the location where these images are to be pulled from, it is assumed to be Docker's default **registry**, Docker hub. The DNS name for which is **docker.io**. The registry is where all the images are stored. Whenever you create a new image or update an image, you push it to the registry and every time anyone deploys this application, it is pulled from the registry.

### Popular Registries

There are many other popular registries as well. Google's registry is at gcr.io, where a lot of Kubernetes related images are stored, like the ones used for performing end-to-end tests on the cluster. 
- e.g. gcr.io/kuberenetes-e2e-test-images/dnsutils

These are all publicly accessible images that anyone can download and access. 

### Using Private Images
When you have applications built in-house that shouldn't be made available to the public, hosting an internal private registry may be a good solution. Many cloud service providers, such as AWS, Azure, or GCP, provide a private registry by default. On any of these solutions, be it on Docker hub or Google's registry or your internal private registry, you may choose to make a repository private so that it can be accessed using a set of credentials.

From Docker's perspective, to run a container using a private image, you first log into your private registry using the Docker login command. 

`$ docker login private-registry.io`
```
Login with your Docker ID to push and pull images from Docker Hub. If you don't have a Docker ID, head over to https://hub.docker.com to create one.
Username: registry-user
Password:
WARNING! Your password will be stored unencrypted in /home/vagrant/.docker/config.json

Login Succeeded

```

Input your credentials. Once successful, run the application using the image from the private registry. 

Going back to our pod definition file, to use an image from our private registry, we replace the image name with the full path to the one in the private registry.

`$ docker login private-registry.io`
`$ docker run private-registry.io/apps/internal-app`

```
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: private-registry.io/apps/internal-app
```

But how do we implement the authentication, the login part? How does Kubernetes get the credentials to access the private registry?
### Kubernetes and Private Registries

Within Kubernetes, we know that the images are pulled and run by the Docker runtime on the worker nodes. How do you pass the credentials to the Docker runtimes on the worker nodes? For that, we first create a secret object with the credentials in it. 

```
$ kubectl create secret docker-registry regcred \
	--docker-server= private-registry.io \
	--docker-username= registry-user \
	--docker-password= registry-password \
	--docker-email= registry-user@org.com
```

The secret is of type docker-registry and we name it regcred. Docker registry is a built-in secret type that was built for storing Docker credentials. 
- We then specify the registry server name, the username to access the registry, the password, and the email address of the user. 
- We then specify the secret inside our pod definition file under the image pull secret section. 
- When the pod is created, Kubernetes or the kubelets on the worker node uses the credentials from the secret to pull images.