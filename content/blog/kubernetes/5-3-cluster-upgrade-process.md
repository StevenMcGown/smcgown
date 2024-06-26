---
title: K8s 5.3 - Cluster Upgrade Process
date: 2024-05-16T07:07:07
summary: Procedure & Guidelines for Upgrading a Kubernetes Cluster
type: "blog"
---
We previously saw how Kubernetes manages its software releases and how different components have their versions. We will keep dependency on external components, like ETCD and CoreDNS, aside for now and focus on the core control plane components:
- Kube API Server
- Controller Manager
- Kube Scheduler
- Kubelet
- Kube-proxy
- Kubectl

Is it mandatory for all of these to have the same version? No. The components can be at different release versions. However, since the KubeAPI Server is the primary component in the control plane, and that is the component that all other components talk to, <mark>none of the other components should ever be at a version higher than the kube-apiserver. </mark>

The **controller-manager** and **scheduler** can be **at most one version lower** than the Kube API Server. 
- If kube-apiserver was at x, controller-managers and kube-schedulers can be at x-2, and the kubelet and kube-proxy components can be at two versions lower, x-2. 
- If kube-apiserver was at 1.10, the controller-manager and scheduler could be at 1.10 or 1.9, and the kubelet and kube-proxy could be at 1.8. None of them could be at a version higher than the kube-apiserver, like 1.11.

This is not the case with **kubectl**. The kubectl utility could be at 1.11, a version higher than the API server, 1.10, the same version as the API server, or at 1.9, a version lower than the API server. This permissible skew in versions allows us to carry out live upgrades. We can upgrade component by component if required.

So, **when** should you upgrade? Say you were at 1.10, and Kubernetes releases versions 1.11, then 1.12. 
- At any time, <mark>Kubernetes supports only up to the recent three minor versions</mark>. So if 1.12 is the latest release, Kubernetes supports versions 1.12, 1.11, and 1.10. 
- When 1.13 is released, only versions 1.13, 1.12, and 1.11 are supported, so if you have anything still below 3 versions, you need to upgrade to keep it within 3 versions.

So, **how** do we upgrade? Do we upgrade directly from 1.10 to 1.13? No. The recommended approach is to do an incremental upgrade one minor version at a time. For example going from version 1.10 to 1.11, then 1.11 to 1.12, and then 1.12 to 1.13. The upgrade process also depends on how your cluster is set up.
- For example, if your cluster is a managed Kubernetes cluster deployed on cloud service providers, like Amazon Web Services, for instance, AWS Elastic Kubernetes Service (EKS) lets you upgrade your cluster easily with just a few clicks. 
- If you deployed your cluster using tools like kubeadm, then the tool can help you plan and upgrade the cluster. If you deployed your cluster from scratch, then you manually upgrade the different components of the cluster yourself.
	- `$ kubeadm upgrade plan`
	- `$ kubeadm upgrade apply`

# Methods for Upgrading a K8s Cluster

Let's say for example you have a cluster with master and worker nodes, running in production, hosting pods, serving users. The nodes and components are at version 1.10.
- Upgrading a cluster involves two major steps. First, you upgrade your master nodes and then upgrade the worker nodes. 

![Cluster Upgrade Process](/images/kubernetes/diagrams/5-3-1-cluster-upgrade-process.png)

## Upgrading the Master Node
While the master is being upgraded, the control plane components, such as the API server, scheduler, and controller-managers, go down briefly. 
- The master going down does not mean your worker nodes and applications on the cluster are impacted. All workloads hosted on the worker nodes continue to serve users as normal. 
- Since the master is down, all management functions are down. You cannot access the cluster using kubectl or other Kubernetes API. You cannot deploy new applications or delete or modify existing ones. 
- The controller managers don't function either; if a pod was to fail, a new pod won't be automatically created. 

However, as long as the nodes and the pods are up, your applications should be up, and users will not be impacted. Once the upgrade is complete and the cluster is back up, it should function normally. 

![Cluster Upgrade Process](/images/kubernetes/diagrams/5-3-2-cluster-upgrade-process.png)
# Upgrading the Worker Nodes
We now have the master and the master components at version 1.11 and the worker nodes at version 1.10. As we saw earlier, this is a supported configuration. It is now time to upgrade the worker nodes.

There are different strategies available to upgrade the worker nodes. 
1) Upgrade all nodes at once
2) Upgrade one node at a time
3) Add new nodes to the cluster with new software version
## Upgrade All Nodes At Once
- But then your pods are down, and users are no longer able to access the applications. Once the upgrade is complete, the nodes are back up, new pods are scheduled, and users can resume access. That's one strategy that requires downtime. 
## Upgrade One Node at a Time
So going back to the state where we have our master upgraded and nodes waiting to be upgraded, we first upgrade the first node, where the workloads move to the second and third node and users are served from there. 
- Once the first node is upgraded and back up, we then update the second node, where the workloads move to the first and third nodes, and finally, the third node, where the workloads are shared between the first two, until we have all nodes upgraded to a newer version. 
- We then follow the same procedure to upgrade the nodes from 1.11 to 1.12 and then 1.13. 
## Add New Nodes with New Software Version
A third strategy would be to add new nodes to the cluster, nodes with newer software version. This is especially convenient if you're on a cloud environment where you can easily provision new nodes and decommission old ones. Nodes with the newer software version can be added to the cluster, move the workload over to the new, and remove the old node until you finally have all new nodes with the new software version.

## Upgrade the K8s cluster with kubeadm
Say we were to upgrade this cluster from 1.11 to 1.13, kubeadm has an upgrade command that helps in upgrading clusters. With kubeadm, run `$ kubeadm upgrade plan` 
command, and it will give you a lot of good information.
![Pasted image 20240212171054.png](/images/kubernetes/images/Pasted-image-20240212171054.png)
- It gives you the **current cluster version**, the kubeadm tool **version**, the and **latest stable version of Kubernetes**.
- It also lists all the control plane **components** and their versions and what version these can be upgraded to. 
- It also tells you that after we upgrade the control plane components, you must manually upgrade the kubelet versions on each node. (Remember, kubeadm does not install or upgrade kubelets) 
- Finally, it gives you the command to upgrade the cluster, which is `$ kubeadm upgrade apply` 

## Upgrading the kubeadm Tool
Also note that **you must upgrade the kubeadm tool itself** before you can upgrade the cluster. The kubeadm tool also follows the same software version as Kubernetes. So in this example we're at 1.11, and we want to go to 1.13. But remember, we can only go one minor version at a time. 
- So first go to 1.12. First, upgrade the kubeadm tool itself to version 1.12:
	`$ apt-get upgrade -y kubeadm=1.12.0-00`
- Then upgrade the cluster using the command from the upgrade plan output, `$ kubeadm upgrade apply v1.12.0`. It pulls the necessary images and upgrades the cluster components. 

Once complete, your control plane components are now at 1.12. If you run the `$ kubectl get nodes` command, you will still see the master node at 1.11. 
- This is because in the output of this command <mark>it is showing the versions of kubelets on each of these nodes registered with the API server</mark> and **not the version of the API server itself**. 
- In this case, the cluster deployed with kubeadm has **kubelets on the master node**, which are used to run the control plane components as pod on the master nodes.
- When we set up a Kubernetes cluster from scratch later we won't install kubelet on the master nodes, so you won't see the master node in the output of the `$ kubectl get nodes` command. 

## Upgrade the Kubelet
So the next step is to upgrade kubelet on the <mark>master node</mark> if you have kubelets on them. 
- First,  run `$ apt-get upgrade kubelet=1.12.0-00` 
- Once the package is upgraded, restart the kubelet service. 
- Running the `$ kubectl get nodes` command now shows that the master has been upgraded to 1.12. 

The worker nodes are still at 1.11, so now upgrade the <mark>worker nodes</mark>. Let us start one at a time. We need to first move the workloads from the first worker node to the other nodes.
- Recall the `$ kubectl drain <node>` command lets you safely terminate all the pods from a node and reschedules them on the other nodes. It also cordons the node and marks it unschedulable. Run `$ kubectl drain node-1` so that no new pods are scheduled on it. 
- Then upgrade the kubeadm and kubelet packages on the worker nodes as we did on the master node: 
```
$ apt-get upgrade -y kubelet=1.12.0-00
$ apt-get upgrade -y kubeadm=1.12.0-00
```
- Then using the kubeadm tool upgrade command, update the node configuration for the new kubelet version: `$ kubeadm upgrade node config --kubelet-version v1.12.0`
- Then restart the kubelet service: `$ systemctl restart kubelet` 
- The node should now be up with the new software version. However, when we drain the node, we actually marked it unschedulable, so we need to unmark it by running the command `$ kubectl uncordon node-1`. 
- The node is now schedulable. But remember that it is not necessary that the pods come right back to this node. It is only marked as schedulable. <mark>Only when the pods are deleted from the other nodes or when new pods are scheduled do they really come back to this first node</mark>. 

Simply repeat these same steps for all other nodes. We now have all nodes upgraded!