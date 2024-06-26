---
title: K8s 3.2 - Managing Application Logs
date: 2024-05-06T07:07:07
summary: Detailed Insight into Management & Analysis of Application Logs in Kubernetes
type: "blog"
---
If you want to see the logs coming from a container, you must use the container's logs command. For example, Docker, say that we run an example container that just generates random logs:
`$ docker run -d testing/event-simulation`

You an view the logs from this container by using the container runtime's logging command, i.e. Docker:
`$ docker logs -f ecf `
- Where `-f` helps see the live log trail and `ecf` is the name of the container

This idea obviously applies to pods running in K8s. Take an example where we create a pod using this same docker container:

`$ kubectl create -f event-simulation.yaml`

event-simulation.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: event-simulation-pod
spec:
  containers:
  - name: event-simulation
    image: testing/event-simulation
```

Just like the Docker command, you can get the logs by using `$ kubectl logs -f event-simulation-pod`

We also know that pods can have multiple containers. Let's say that we modify the above file to have another container:
event-simulation.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: event-simulation-pod
spec:
  containers:
  - name: event-simulation
    image: testing/event-simulation
  - name: image-processor
    image: test-image-processor
```

If you have multiple containers running on the pod, you must specify the name of the pod whenever you run the logs command. Otherwise, it will fail.

`$ kubectl logs -f test-image-processor`