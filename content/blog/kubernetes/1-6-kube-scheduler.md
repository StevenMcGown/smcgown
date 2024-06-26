---
title: K8s 1.6 - Kubernetes Scheduler
date: 2024-04-10T07:07:07
summary: Detailed exploration into the Kubernetes Scheduler
type: "blog"
---
The Kube scheduler is the <mark>default scheduler</mark> responsible for determining which pod goes on which node. It doesn't actually place the pod on the node, that's the job of the kubelet. The scheduler is needed because certain criteria may be needed for certain nodes.
  - For example, you may have pods with different resource requirements or you may have certain nodes dedicated to certain applications.
  - The scheduler assigns pods by looking at each pod and tries to find the best node for it. It goes through 2 phases to do this:
    1. First, it filters out pods that do not have the required profile for the pod. In this example, the nodes crossed out do not have sufficient CPU.
    2. Second, the scheduler ranks the remaining nodes to identify the best fit for the pod with a priority function, which assigns a score to the nodes from 0 to 10.
      - For example, it may calculate the amount of resources that would be free on the nodes after placing the pod on them. In this case, the last one in the list was chosen (1.3T).

As usual, you can download and install the scheduler binary to create it manually.
- To view the scheduler options as installed by kubeadm, it is created as a pod in the kube-system namespace on the master node.
- `$ cat /etc/kubernetes/manifests/kube-scheduler.yaml` - To view manually, it is listed as a service.
- To view processes, use `ps -aux | grep kube-scheduler`.