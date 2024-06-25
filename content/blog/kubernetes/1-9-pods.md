---
title: K8s 1.9 - Pods
date: 2024-04-13T07:07:07
summary: Detailed Exploration of Kubernetes Pods & Their Functionality
---
At this point, we have assumed that we have working Docker images of the application made into a Docker repository and that the k8s cluster is up and running. <mark>Containers are not deployed directly onto nodes, they are encapsulated into pods,</mark> which are the single instance of an application and the smallest object that you can create in Kubernetes.
- You can have multiple containers inside of a pod, but if you are scaling an application, you do not deploy multiple containers to a pod. Rather, you would deploy more pods on the node, so pods and containers have a 1-to-1 relationship.
- If the node runs out of resources while scaling pods, you can create new nodes to put more pods in.
- You might put multiple containers in the same pod if it is doing some sort of support task. For example, a web application container might have another container for processing files uploaded by the user.
- You can have both of these containers part of the same pod so that when a new application container is created, the helper is also created. In turn, when one of the containers dies, the helper also dies since they are part of the same pod.
- Since the containers share the same network space, they can also reach each other by referring to each other as localhost. They can also share the same storage space as well.

Example of deploying containers on a pod:
- `$ kubectl run nginx --image nginx`
- To specify where Kubernetes gets nginx from, the `--image` attribute is used. In this case, it is downloaded from the Docker Hub repository.

To show which pods are available, use:
- `$ kubectl get pods`
- Keep in mind that in this example, the web server has not been made available to external users. You can, however, access it internally from the node.

# Creating Pods with YAML
  - K8s uses YAML files for the creation of objects such as pods, replicas, deployments, services, etc.
  - A definition file always contains 4 top-level fields: apiVersion, kind, metadata, spec.
  
 Example YAML file for creating a pod (pod-definition.yml):
 
```
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
    type: front-end
spec:
  containers:
    - name: nginx-container
      image: nginx
```
- **apiVersion**: the version of the K8 API we are using to create the object. Depending on what we are trying to create, we need to deploy the right version.
- **kind**: The kind of object we are trying to create. In this case, we are creating pods. Other values include replica set, deployment, service, etc.
- **metadata**: Data above the object such as name, labels, etc. Unlike the first two (apiVersion and kind) which are strings, the kind field is a dictionary.
- **labels**: Labels are required fields. You can only add name and labels under metadata, however, you can add anything you want under labels.
- **spec**: Depending on the kind of object, you can provide additional information pertaining to that object here.
- **containers**: A list that can hold multiple container objects in it. Each item in the list is indicated by a hyphen. In this case, the first object is a dictionary with a name and image property. The image "nginx" is grabbed from the Docker repository.
- To create the pod, use the command `$ kubectl create -f pod-definition.yml`.