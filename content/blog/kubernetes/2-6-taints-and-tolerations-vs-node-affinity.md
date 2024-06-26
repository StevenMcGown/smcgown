---
title: K8s 2.6 - Taints and Tolerations vs Node Affinity
date: 2024-04-29T07:07:07
summary: Detailed analysis of Kubernetes Taints, Tolerations and Node Affinity, demonstrating how to manage workload deployments effectively.
type: "blog"
---
Take an example below: There are 5 nodes. The first one is tainted blue, the second red, and the third green.

![Taints & Tolerations vs. Node Affinity]
Let's assume that in this example, we are sharing a cluster with other teams. So there are other teams' pods in the cluster, as well as other nodes. We don't want other teams to be able to put pods on other team's nodes, so we can set up taints on the nodes to prevent the pods from being moved onto them, and tolerations on the pods to allow them on certain tainted nodes.
- HOWEVER, this does not guarantee that pods with certain tolerations will be placed on the respective nodes. We can solve this issue with Node Affinity.

With node affinity, we first label the nodes with their respective colors. We then set node selectors on the pods to tie the pods to the nodes. This, however, does not guarantee that other pods are not placed on these nodes. ==If you want to do this, you should use Node Affinity in combination with Taints and Tolerations:
  1) Prevent other pods from being placed on our nodes (Taints + Tolerations).
  2) Prevent our pods from being placed on other nodes (Node Affinity).