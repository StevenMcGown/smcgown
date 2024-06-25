---
title: K8s 2.2 - Labels and Selectors
date: 2024-04-25T07:07:07
summary: Understanding and Working with Kubernetes Labels and Selectors
---

Labels in Kubernetes are key-value pairs that are attached to objects like pods, nodes, services, and more. They are <mark>used to organize and select subsets of objects in a Kubernetes cluster</mark>. Labels are flexible and can be applied to a variety of resources.
- There may be hundreds or thousands of objects (pods, services, replicasets, deployments, etc.) that you can group and select using labels & selectors.
  
```
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: simple-webapp
  labels: # replicaset labels
    app: App1
    function: Front-end
  annotations: # Used for information purposes
    buildversion: 1.34
spec:
  replicas: 3
  selector:
    matchLabels:
      app: App1
template:
  metadata:
    labels: # pod labels
      app: App1
      function: Front-end
  spec:
    containers:
    - name: simple-webapp
      image: simple-webapp:21
```

You can filter objects with labels using the -l flag

Annotations are use for informational purposes. For example, tool details like name, version, build information etc may be used for some kind of integration purpose.