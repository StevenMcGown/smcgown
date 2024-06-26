---
title: K8s 4.5 - Multi-Container Pods in Kubernetes
date: 2024-05-11T07:07:07
summary: Detailed analysis on the use and administration of multi-container pods in Kubernetes
type: "blog"
---
The idea of decoupling a large monolithic application into subcomponents is known as **microservices**. Using microservices enables us to develop and deploy a set of independent, small, and reusable code. This architecture can then help us scale up, down, as well as modify each service as required, as opposed to modifying the entire application. We can achieve this using multi-container pods.

Sometimes, you might want two different services to cooperate, like a web server and a logging service. Each web server needs its own logging service, but you don't want to mix their code because they serve different purposes and you want to develop and deploy them separately.
- You just need them to work in sync, so you pair one logging service with each web server. These pairs can grow or shrink together, which is why they're in multi-container pods that start and stop at the same time.

![Multi-Container Pods](/images/kubernetes/diagrams/4-5-1-multi-container-pods.png)

They share the same network space, which means they can refer to each other as localhost, and they have access to the same storage volumes.
- This way you do not have to establish volume sharing or services between the pods to enable communication between them.

To create a multi-container pod, add the new container information to a pod definition file. 
- Remember the container section under the spec section in a pod definition file is an array, and the reason it is an array is to allow multiple containers in a single pod. 
- In this case, we add a new container named log agent to our existing pod.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: simple-webapp
  labels:
    name: simple-webapp
spec:
  containers:
  - name: simple-webapp
    image: simple-webapp
    ports:
    - containerPort: 8080
  - name: log-agent
    image: log-agent

```

# Multi-Container Pods Design Patterns
There are 3 common patterns, when it comes to designing multi-container PODs. The logging service example is known as a **side car** pattern. The others are the adapter and the ambassador pattern.
- The example that we mentioned above is a **sidecar** pattern.

**Adapter**: An adapter in Kubernetes is a container that helps to <mark>translate or transform data between different formats or protocols</mark>. It acts as a **middleware component** to adapt the communication between the main container and external systems. 
- One common example is an authentication adapter, which authenticates requests from the main application container to external services.
- **Example**: Imagine you have a microservice written in Go that communicates with an external REST API using OAuth2 for authentication. You can deploy an adapter container alongside your main application container. This adapter container handles the OAuth2 authentication process, translating requests from your application container into properly authenticated requests to the external API.

**Ambassador**: An ambassador in Kubernetes is a pattern used to offload common networking-related concerns from microservices, such as routing, load balancing, and SSL termination. It acts as a proxy that intercepts and forwards requests to the appropriate microservice instances.
- **Example**: Let's say you have a microservices architecture with multiple services written in different programming languages. Each service exposes its own HTTP endpoints. You can deploy an ambassador container, like Envoy or HAProxy, as a sidecar alongside each microservice. 
- The ambassador container manages the ingress and egress traffic for its associated microservice, handling tasks like routing requests to the correct service instance, load balancing across instances, and terminating SSL connections. This allows the microservice itself to focus solely on its business logic without worrying about network concerns.

