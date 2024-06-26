---
title: K8s 3.1 - Monitor Cluster Components
date: 2024-05-05T07:07:07
summary: Overview and guide on monitoring cluster components in Kubernetes
type: "blog"
---
You can monitor a kubernetes cluster using tools like **Dynatrace**. **Heapster** was one of the original monitoring solutions but is now deprecated, and **Metrics Server** is the slimmed-down version.
  - You can have 1 Metrics server per K8s cluster.
  - The Metrics server retrieves metrics from each of the K8s nodes and pods, aggregates them, and stores them in memory.
  - Note that the Metrics server is only an in-memory monitoring solution and does not store metrics on the disk. <mark>As a result, you cannot see historical performance data.</mark> For that, you need solutions like Dynatrace.

K8s runs the kubelet for many reasons, one of which is to retrieve metrics from running pods on the node. This is done through the Kubelet's subcomponent known as the **"cAdvisor"** or "Container Advisor". The Advisor retrieves performance metrics and exposes them through the Kubelet API to make them available to the Metrics Server, which can then be forwarded to proprietary monitoring solutions such as Dynatrace.

Overview of components involved in monitoring a K8s cluster:
  - Metrics Server
  - cAdvisor
  - Kubelet

To view cluster performance, you can use the following commands:
  - `$ kubectl create of deplay/1.84/`
  - Once data is collected and processed, you can view cluster performance by running the command `$ kubectl top node`, which provides CPU Memory consumption of each node.
  - You can do the same for pods with `$ kubectl top pod`.