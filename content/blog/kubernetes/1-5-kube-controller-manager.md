---
title: K8s 1.5 - Kube Controller Manager
date: 2024-04-09T07:07:07
summary: Detailed Insight into Kube Controller Manager and Its Management
---
In Kubernetes terminology, a controller is a process that continually monitors the state of various components within the system and works towards bringing the whole system to the desired functioning state.
- **Node Controller** is responsible for monitoring the status of the nodes and taking necessary actions to keep the applications running. It does this through the KubeAPI Server. This controller tests the status of the nodes every five seconds so it can continuously monitor the health of the nodes. If it cannot reach a node for 40 seconds, it is marked as unreachable. After it is marked as unreachable, it gets 5 minutes to come back up. If it doesn't, it removes the pods assigned to that node and provisions them on the healthy ones if the pods were part of a replica set.
- **Replication Controller** is responsible for monitoring the status of replica sets and ensuring that the desired number of pods are available at all times within the set. If a pod dies, it creates another one.
- There are many more controllers, and they are all packaged into a single controller known as the Kube-controller-manager. So when you install the Kube-controller-manager, the other different Controllers get installed as well.

How do you view the Kube-controller-manager server options?
  - For Kubeadm setups, it is a pod in the Kube-system namespace on the master node.
    - `$ kubectl get pods -n kube-system`
  - For non-Kubeadm setups, you can view the binary located at the services directory.
    - `$ cat /etc/systemd/system/kube-controller-manager`
  - You can also see the many processes and the effective options by listing the process on the master node and searching for Kube-controller-manager.
    - `$ ps -aux | grep kube-controller-manager`