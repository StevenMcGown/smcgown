---
title: K8s 1.7  Kubelet
date: 2024-04-11T07:07:07
summary: A Comprehensive Guide on Kubelet in K8s Administration
---
The kubelet on the worker node registers the node with the kubernetes cluster. When it receives a request to load a container or pod, it requests the container runtime engine to pull the required image.
  - The kubelet then continues to monitor the state of the pod and containers in it and reports to the Kubernetes API server.
  - The kubelet is not automatically installed by kubeadm, it has to be done manually.