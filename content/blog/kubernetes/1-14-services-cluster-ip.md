---
title: K8s 1.14 - Services and Cluster IP
date: 2024-04-18T07:07:07
summary: Understanding and Implementation of Services and Cluster IP in Kubernetes
---
The Cluster IP Service is which <mark>creates a virtual IP inside the cluster to enable communication between different services within the cluster.</mark>

A full stack web application has different types of pods hosting different parts of the application. For example, one part may be running a front-end server, another part may be running the backend, and there may even be pods running a key-value store like Redis and a persistent database like MySQL.

![Services Cluster IP](/images/kubernetes/diagrams/1-14-1-services-cluster-ip.png)


- These pods are assigned IPs like 10.244.0.3, 10.244.0.2, 10.244.0.4 which **are not static**, meaning these pods could go down at any time and you can't rely on them if you want to have communication between the different tiers of the application. So the services provide a single point of access for the tiers to communicate which each other. 
- They also help achieve this cascading architecture, where front end is meant to communicate with backend, and back end is meant to communicate with Redis. This enforces that traffic reaches the back end before going to redis.
- Also, as shown in previous services examples, the requests are forwarded to the pods under the service randomly.
- This enables you to effectively deploy a microservices-based application on a Kubernetes cluster. Each layer can now scale or more as required without impacting communication between the various services.

Here's how to create one using a definition file:

service-definition.yaml
```
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  type: ClusterIP
  ports:
    - targetPort: 80
      port: 80
  selector:
    app: myapp
    type: backend
```

We can create the service using:
`$ kubectl create -f service-definition.yaml`

To get services:
`$ kubectl get services`