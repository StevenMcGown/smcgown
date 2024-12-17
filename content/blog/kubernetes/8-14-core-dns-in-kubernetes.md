---
title: K8s 8.14 - Core DNS in Kubernetes
date: 2024-08-23T07:07:07
summary: A detailed exploration of how Kubernetes implements DNS within the cluster, focusing on CoreDNS and its configuration.
type: "blog"
---

In this post, we’ll explore how Kubernetes handles DNS within the cluster. Previously, we discussed how one pod can communicate with another pod or service. Now, we’ll dive into the DNS infrastructure that makes this connectivity seamless.

---

### The Challenges of Manual DNS Resolution  

Imagine you have two pods, such as a `test` pod and a `web` pod, each with unique IP addresses. To enable communication, you might manually add entries to the `/etc/hosts` file in each pod. While this approach works in a small setup, it becomes impractical as the cluster scales. In a dynamic environment where thousands of pods are created and destroyed frequently, maintaining `/etc/hosts` entries for each pod across the cluster would be unmanageable.  

Kubernetes addresses this issue by centralizing DNS management with a dedicated DNS server. Each pod is automatically configured to use this DNS server through an entry in its `/etc/resolv.conf` file, pointing to the server's IP address (e.g., `10.96.0.10`). Kubernetes takes care of dynamically adding new pods, such as a `db` pod, to the DNS server’s records.  

- Recall that Kubernetes generates hostnames for pods by converting their IP addresses into a dashed format.  

![Core DNS in K8s](/images/kubernetes/diagrams/8-14-1-core-dns-in-k8s.png)

---

### CoreDNS: Kubernetes’ DNS Server  

Kubernetes includes a built-in DNS server within the cluster. Initially, it used **kube-dns**, but since version 1.12, **CoreDNS** has been the default DNS implementation.  

#### CoreDNS Deployment  
CoreDNS runs as a pod within the `kube-system` namespace and is typically deployed in a replica set with two pods for redundancy. These pods run the CoreDNS executable, just like a standalone CoreDNS setup.  

#### CoreDNS Configuration  
CoreDNS uses a configuration file called **Corefile**, located at `/etc/coredns`. This file defines various plugins that handle features such as error logging, health monitoring, metrics, caching, and Kubernetes-specific functionality. The **kubernetes** plugin is key to integrating CoreDNS with the cluster, setting the cluster's top-level domain (e.g., `cluster.local`) and enabling DNS record creation for services and pods.  

The Corefile is injected into CoreDNS pods via a Kubernetes ConfigMap, making updates straightforward.  

```
$ cat /etc/coredns/Corefile

.:53 {
    errors                  # Logs DNS errors
    health { lameduck 5s }  # Monitors CoreDNS health
    kubernetes cluster.local in-addr.arpa ip6.arpa {
        pods insecure        # Creates DNS records for pods
        upstream
        fallthrough in-addr.arpa ip6.arpa
    }
    prometheus :9153
    forward . /etc/resolv.conf {  # Forwards external queries
        max_concurrent 1000
    }
    cache 30
    loop
    reload
    loadbalance
}
```

The **kubernetes** plugin is responsible for creating DNS records for cluster services and, optionally, for pods (using the `pods` option). External queries, such as `www.google.com`, are forwarded to the nameservers defined in the CoreDNS pod's `/etc/resolv.conf`.  

For more details on CoreDNS plugins, visit [CoreDNS Plugins](https://coredns.io/plugins/).  

---

### DNS Configuration for Pods  

When a new pod or service is created, CoreDNS automatically adds a corresponding DNS record. To enable this, Kubernetes creates a default service named `kube-dns`, exposing CoreDNS within the cluster.  

```
$ kubectl get service -n kube-system
NAME        TYPE        CLUSTER-IP  EXTERNAL-IP     PORT(S)
kube-dns    ClusterIP   10.96.0.10  <none>          53/UDP,53/TCP
```

Each pod’s `/etc/resolv.conf` file is configured to use the CoreDNS service as its nameserver:  

```
$ cat /etc/resolv.conf
nameserver      10.96.0.10
```

This setup allows pods to resolve service names using various formats:  
- `web-service`  
- `web-service.default`  
- `web-service.default.svc`  
- `web-service.default.svc.cluster.local`  

When querying a service using tools like `nslookup` or `host`, the fully qualified domain name (FQDN) is returned, even if you use a shorter name. This works because the `/etc/resolv.conf` file includes search domains like `default.svc.cluster.local`, `svc.cluster.local`, and `cluster.local`.  

However, these search domains apply **only to services**. To resolve a pod's name, you must use its FQDN.  

---

### Seamless Connectivity Within the Cluster  

With this DNS setup, Kubernetes ensures pods and services can easily communicate without manual intervention. The kubelet manages the necessary configuration, dynamically updating DNS records as pods and services are added or removed.  

This centralized approach to DNS simplifies communication, reduces manual effort, and scales seamlessly with the cluster's size and complexity.  

![CoreDNS in K8s](/images/kubernetes/diagrams/8-14-2-core-dns-in-k8s.png)  