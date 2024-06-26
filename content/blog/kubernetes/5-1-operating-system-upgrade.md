---
title: K8s 5.1 - Operating System Upgrade
date: 2024-05-14T07:07:07
summary: A comprehensive guide to operating system upgrades in Kubernetes
type: "blog"
---
There are many scenarios where you might have to take down nodes as part of your cluster, say for maintenance purposes, like upgrading a based software or applying patches, like security patches, et cetera, on your cluster.
- What happens when one of these nodes go down? Of course, the pods on them are not accessible.
![OS Upgrades](/images/kubernetes/diagrams/5-1-1-os-upgrades.png)
- Depending upon how you deployed those pods, your users may be impacted. For example, since you have multiple replicas of the blue pod, the users accessing the blue application are not impacted since they are being served through the other blue pod that's online. 
- However, **users accessing the green pod are impacted as that was the only pod running the green application.**

Now, what does Kubernetes do in this case? 
- If the node came back online immediately, then the kubelet process starts and the pods come back online. 
- However, if the node was down for more than five minutes, then the pods are terminated from that node because **Kubernetes considers them as dead**. If the pods were part of your replica set, <mark>then they are recreated on other nodes.</mark>

The time it waits for a pod to come back online is known as the <mark>pod-eviction-timeout</mark> and is set on the Kube Controller Manager with a default value of five minutes. Recall the location of the **Controller Manager:**
- For Kubeadm setups, it is a pod in the Kube-system namespace on the master node.
    - `$ kubectl get pods -n kube-system`
  - For non-Kubeadm setups, you can view the binary located at the services directory.
    - `$ cat /etc/systemd/system/kube-controller-manager`
- The `--pod-eviction-timeout` option again is by default 5 minutes:
- --pod-eviction-timeout=5m0s

So whenever a node goes offline, the master node waits for up to five minutes before considering the node dead. When the node comes back online after the **pod-eviction-timeout**, it comes up blank without any pod scheduled on it.
- Since the blue pod was part of a replica set, it had a new pod created on another node. However, since the green pod was not part of a replica set, it's just gone. 
- Therefore, if you have **maintenance tasks** to be performed on a node consider these things: 
1) Do the workloads running on the node have other replicas? 
2) Is it okay that they go down for a short period of time? 
3) Are you sure the node will come back online within five minutes?
If you're sure that one or more of these is true, you can make a quick upgrade and reboot without worrying about the pod-eviction-timeout.

However, if you don't know for sure if that a node will come back online in within five minutes, you can't for sure say it is going to be back at all. Is there is a safer way to do it?
- You can purposefully **drain the node** of all the workloads so the pods are gracefully terminated from the node that they're on and recreated on another.
	`$ kubectl drain <node-name>`
- The node is also **cordoned** or **marked as unschedulable**, meaning no pods can be scheduled on this node <mark>until you specifically remove the restriction</mark>.

Now that the pods are safe on the other nodes, you can reboot the first node. When it comes back online, the node that was marked is still **unschedulable**. 
- You then need to **uncordon** it so that the pods can be scheduled on it again. Now, remember, the pods that were "moved" to the other nodes don't automatically fall back. 
	`$ kubectl uncordon <node-name>`
- If any of those pods were deleted or if new pods were created in the cluster, then they would be created on this node.

Apart from drain and uncordon, there is also another command called cordon. 
`$ kubectl cordon <node-name>`
- Cordon simply marks a node unschedulable. Unlike drain, it does not terminate or move the pods on an existing node. It <mark>simply makes sure that new pods are not scheduled on that node.</mark> 

Consider the following scenario where you might opt for `cordon` over `drain`: 
- Imagine you're performing maintenance on a node, such as applying security patches. You want to avoid scheduling new pods on this node to **prevent service disruptions** but still allow existing pods to continue running until you're ready to gracefully terminate them. 
- In this situation, you can use the cordon command to mark the node as unschedulable, maintaining the stability of your workload while ensuring no new pods are scheduled on the node undergoing maintenance.