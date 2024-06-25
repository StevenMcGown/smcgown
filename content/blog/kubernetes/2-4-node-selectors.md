---
title: K8s 2.4 - Working with Node Selectors
date: 2024-04-27T07:07:07
summary: Understanding and Implementing Node Selectors in Kubernetes
---
Node selectors in Kubernetes are used to <mark>constrain which nodes your pod is eligible to be scheduled based on labels on nodes</mark>. By setting a node selector for pods, you specify a requirement that nodes must have a certain label for the pod to be scheduled on them.

Starting with an example, you have a small cluster with 3 worker nodes, where 1 of the nodes is a larger node configured with higher resources
- You have data processing workloads that you want to be dedicated for the larger node with a higher amount of resources
```
apiVersion: v1
kind: Pod
metadata:
  name: myapp-prod
spec:
  containers:
  - name: data-processor
    image: data-processor
  nodeSelector:
    size: Large
```
  
Now when a pod is created using the definition file, it will go on the node with the same tags that are specified under the **nodeSelector** attribute.
- We can also add tags to a ndoe by using `$ kubectl label nodes node-1 size=Large`

This serves its purpose, but node Selectors have their limitations. What if we want to assign pods to a node in a more complex way? For example, Large OR medium? Any node that is NOT small?
- This is where Node Affinity comes into play.