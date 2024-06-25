---
title: K8s 8.3 - Core DNS in Kubernetes
date: 2024-06-15T07:07:07
summary: Understanding and Working with Core DNS in Kubernetes
---
### Setting Up a DNS Server with CoreDNS

In the previous post, we discussed the importance of a DNS server for managing name resolution in large environments with numerous hostnames and IPs. We also covered how to configure your hosts to point to a DNS server. In this post, we will learn how to configure a host as a DNS server using CoreDNS.

We are given a server dedicated to acting as the DNS server, along with a set of IPs to configure as entries in the server. There are many DNS server solutions available; in this lecture, we will focus on CoreDNS.

#### Getting CoreDNS

You can obtain CoreDNS binaries from their GitHub releases page or as a Docker image. Here, we'll use the traditional method. Download the binary using `curl` or `wget` and extract it. This provides you with the CoreDNS executable.

#### Running CoreDNS

Run the CoreDNS executable to start the DNS server. By default, it listens on port 53, the standard port for DNS servers.

#### Configuring IP to Hostname Mappings

To specify IP to hostname mappings, you need to provide some configurations. One way to do this is by putting all the entries into the DNS server's `/etc/hosts` file. Then, configure CoreDNS to use that file.

CoreDNS loads its configuration from a file named `Corefile`. Here is a simple configuration that instructs CoreDNS to fetch the IP to hostname mappings from the `/etc/hosts` file:

```
. {
    hosts /etc/hosts {
        fallthrough
    }
}
```

When the DNS server is run, it now picks up the IPs and names from the `/etc/hosts` file on the server.

#### Advanced Configurations

CoreDNS supports other methods for configuring DNS entries through plugins. We will explore the plugin it uses for Kubernetes in a later section.

For more information on CoreDNS, you can visit:
- [CoreDNS Specification on GitHub](https://github.com/kubernetes/dns/blob/master/docs/specification.md)
- [CoreDNS Kubernetes Plugin](https://coredns.io/plugins/kubernetes/)