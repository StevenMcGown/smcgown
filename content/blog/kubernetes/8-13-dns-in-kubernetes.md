---
title: K8s 8.13 - DNS in Kubernetes Clusters
date: 2024-08-22T07:07:07
summary: An overview of DNS in Kubernetes, covering service and pod DNS records, and how DNS resolution is handled within the cluster.
type: "blog"
---

Previously, we covered the basics of DNS, using tools like `host`, `nslookup`, and the `dig` utility, as well as different types of DNS records such as A, CNAME, etc. We also learned how to set up our own DNS server using CoreDNS.

In this post, we will focus on what names are assigned to various objects in the cluster, what service DNS records and pod DNS records are, and the different ways you can reach one pod from another. In the next post, we will see how Kubernetes implements DNS within the cluster.

## Cluster DNS Overview
Let's say that we have a three-node Kubernetes cluster with some pods and services deployed on them. Each node has a name and an IP address assigned to it, and these may be registered in a DNS server within your organization. 

![DNS in K8s](/images/kubernetes/diagrams/8-13-1-dns-in-k8s.png)

However, the management and access to these node names and IPs are not the focus of this post. Instead, we will discuss DNS resolution within the cluster, specifically between different components like pods and services.

Kubernetes deploys a built-in DNS server by default when you set up a cluster. If you set up Kubernetes manually, you might need to configure this yourself. In this post, we'll see how Kubernetes DNS helps pods resolve other pods and services within the cluster.

![DNS in K8s](/images/kubernetes/diagrams/8-13-2-dns-in-k8s.png)

## Service DNS Records
Let's start with a simple example involving two pods and a service. Suppose we have:
- A **test pod** with IP `10.244.1.5`.
- A **web pod** with IP `10.244.2.5`.
- And a **web-service** with IP `10.107.37.188`

![DNS in K8s](/images/kubernetes/diagrams/8-13-3-dns-in-k8s.png)

Looking at their IPs, you might guess that they are hosted on different nodes, but for DNS purposes, that doesn't matter as long as they can reach each other using their IP addresses. To make the web server accessible to the test pod, we create a service named **web-service**. This service gets an IP address, such as `10.107.37.188`.

As we showed before in the previous post, whenever a service is created, the Kubernetes DNS service automatically creates a DNS record for the service, mapping the service name to the IP address. This allows any pod within the cluster to reach the service using its name.

![DNS in K8s](/images/kubernetes/diagrams/8-13-4-dns-in-k8s.png)

### Namespace and Service Resolution
In Kubernetes, if the test pod, web pod, and web-service are all in the same namespace (e.g., the **default** namespace), the test pod can reach the web-service using just the service name, `web-service`.

```
$ curl http://web-service
```

![DNS in K8s](/images/kubernetes/diagrams/8-13-5-dns-in-k8s.png)


If the web-service is in a different namespace named **apps**, the test pod would need to use the full name: `web-service.apps`. The **apps** part of the name refers to the namespace. The DNS server in Kubernetes creates a subdomain for each namespace, grouping all services within that namespace under the subdomain.

```
$ curl http://web-service.apps
```

![DNS in K8s](/images/kubernetes/diagrams/8-13-6-dns-in-k8s.png)

### Fully Qualified Domain Names
All services are further grouped into another subdomain called `svc` (abbreviated for service). Thus, the fully qualified domain name (FQDN) for the web-service would be `web-service.apps.svc.cluster.local`, with `cluster.local` being the root domain for the cluster. 
- `cluster.local` is the default root domain in most Kubernetes setups, but you can change it by configuring the kubelet’s `--cluster-domain` flag when setting up your cluster. For example, if you set this to `mycluster.local`, service FQDNs would end with `.svc.mycluster.local` instead.

![DNS in K8s](/images/kubernetes/diagrams/8-13-7-dns-in-k8s.png)

## Pod DNS Records
Unlike services, DNS records for pods are not created by default. However, you can enable this feature explicitly. When enabled, DNS records are created for pods, but not using their pod names. Instead, Kubernetes generates a hostname by converting the pod's IP address into a format where dots are replaced by dashes.

For example, the test pod in the **default** namespace with IP `10.244.1.5` would get a DNS record like `10-244-1-5.default.pod.cluster.local`, pointing to the pod's IP address.

![DNS in K8s](/images/kubernetes/diagrams/8-13-8-dns-in-k8s.png)

You can reach this pod with the DNS name like before:
```
$ curl http:10-244-2-5.apps.pod.cluster.local 
```

