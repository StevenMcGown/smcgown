---
title: K8s 2.8  DaemonSets
date: 2024-05-01T07:07:07
summary: Deep Dive into the Usage and Management of DaemonSets in Kubernetes
---
Daemonsets are like Replica Sets; they help you deploy multiple instances of pods, but they help <mark>ensure that one copy of the pod is on each node in the cluster.</mark>
- Whenever a new node is added to the cluster, a replica of the pod is automatically added to that node, and when a node is removed, that pod is also removed.

Use cases for Daemonsets:
- Deploying monitoring agents such as Prometheus or Fluentd.
- Security & Network policies: Intrusion detection systems, firewalls, network overlay solutions.
- Storage Solutions: Distributed Filesystems, storage plugins, volume drivers.
- A common use case of a Daemonset is for deploying the Kube Proxy component.

daemonset-definition.yaml
```
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: monitoring-daemon
spec:
  selector:
    matchLabels:
      app: monitoring-agent
  template:
    metadata:
      labels:
        app: monitoring-agent
    spec:
      containers:
      - name: monitoring-agent
        image: monitoring-agent
```
- Daemonsets are almost exactly like a Replica Set in the definition file, except for the kind
- When discussing scheduling, we mentioned that you can set the "nodeName" property on pods to bypass the scheduler and get placed on a node directly. 
	- Again, this is not how you how normally schedule a pod, but this was how Daemonsets worked until k8s v1.12
	- After this, it uses the default scheduler and Node Affinity rules.