---
title: K8s 2.3 - Taints and Tolerations
date: 2024-04-26T07:07:07
summary: Understanding the mechanism of Taints and Tolerations in Kubernetes
type: "blog"
---
Taints and Tolerations are mechanisms used to <mark>control which nodes can or cannot run specific [[1.9 - Pods]]</mark>. This is useful when you want to influence the scheduling of pods based on certain conditions or constraints.
![Taints and Tolerations](/images/kubernetes/diagrams/2-3-2-taints-and-tolerations.png)

In this situation, pods will be scheduled based on a variety of factors, but nodes with particular taints will only accept pods with the respective tolerations. 
- For example, pods A and C can be placed on nodes 2, 3 and 4. Pod D can be placed on nodes 1 and 2, and pods B and E can be placed on node 2. Pods with tolerations can be placed on nodes with no taints.

To taint a node, use the command `$ kubectl taint nodes node-name key=value:taint-effect`, where taint-effect can be one of the following: NoSchedule, PreferNoSchedule, or NoExecute. 
- **NoSchedule** completely disallows new pods from being scheduled to the node.
- **PreferNoSchedule** indicates a preference for not scheduling new pods to the node, but does not completely prevent it.
- **NoExecute** evicts existing pods from the node if they do not tolerate the taint.

To specify a toleration in a pod definition file, use the following format:

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
  tolerations: # all tolerations fields are in double quotes
  - key: "app"
    operator: "Equal"
    value: "green"
    effect: "NoSchedule"
```

Note that tolerations and taints prevent pods from being placed on nodes, <mark>they do not guarantee that they will be placed on specific nodes.</mark>

As a side note, the master node has a taint that prevents any pods from being deployed on it.