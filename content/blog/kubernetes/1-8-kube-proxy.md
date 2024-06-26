---
title: K8s 1.8  kube-proxy
date: 2024-04-12T07:07:07
summary: Deep Dive into the Functionality & Use of kube-proxy in Kubernetes
type: "blog"
---
In a k8s cluster, every pod can reach every other pod. This is accomplished by deploying a pod networking solution to the cluster, which is an internal virtual network that spans across all the nodes in the cluster to which all the pods connect. This enables all of the pods to communicate with each other.
![KubeProxy](/images/kubernetes/diagrams/1-8-1-kube-proxy.png)
In this example, there is a web app deployed on the first node and a DB app deployed on the second.
- There is no guarantee the IP of either node won't change, so we use a service to expose the database application across the cluster.
- The web application can now access the database using the name of the service (DB), which also has an IP address.
	- Whenever a pod tries to reach the service using its IP, the traffic is forwarded to the backend pool, in this case, the Database.
The service is not actually part of the POD network, it is implemented through Kube-proxy, which runs on each node in the cluster. The Kube-proxy's job is to look for new services, and every time a new service is created, it creates the appropriate rules on each node to forward traffic to those services.
- One way it does this is using iptables rules. In the example above, it creates an iptables rule on each node in the cluster to forward traffic heading to the IP of the service (10.96.0.12) to the IP of the pod (10.32.0.15).
- The kubeadmin tool deploys Kube-proxy as a pod on each node. In fact, it is deployed as a Daemonsets, so a single pod is always deployed on each node of the cluster.