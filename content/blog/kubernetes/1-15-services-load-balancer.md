---
title: K8s 1.15 - Services & Load Balancer
date: 2024-04-19T07:07:07
summary: Exploring K8s Services, Load Balancer and its role in traffic routing
type: "blog"
---
The NodePort service allows you to load balance on a port across worker nodes, but we can also utilize the **Load Balancer** service, which <mark>provisions a load balancer for an application in supported cloud providers, distributing load across web servers in the frontend tier.</mark>

The below architecture can be achieved with the NodePort service only, except for the URLs, which is why we opt for the LoadBalancer service, since normal people don't want to connect to an application with an IP address, but rather a user-friendly domain name. 
- e.g. http://example-vote.com or http://example-result.com
![Services LoadBalancer](/images/kubernetes/diagrams/1-13-5-services.png)
So that's four combinations of IP addresses for the vote-app and result-app respectively.
- <mark>Even though the pods for the different applications are deployed on different nodes, you can still access them using the ports on all nodes of the cluster.</mark>
- We can use a cloud service (In this case AWS Network Load Balancer) to load balance to pods across nodes using the URLs. You could use 9 VMs to do this, but it would be tedious and K8s has support for integrating with native load balancers of certain cloud providers. So all you would do is set the type Load Balancer under the "spec" attribute.