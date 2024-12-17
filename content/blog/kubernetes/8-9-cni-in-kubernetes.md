---
title: K8s 8.9 - CNI in Kubernetes
date: 2024-08-18T07:07:07
summary: A detailed exploration of how CNI networking plugins integrate with Kubernetes, from configuration to implementation.
type: "blog"
---
## Introduction
In the previous posts, we covered the basics of network namespaces and explored how networking is handled in Docker. We then discussed the importance of networking standards for containers and introduced the Container Network Interface (CNI). We also reviewed the list of supported plugins available with CNI. 

In this post, we will focus on how Kubernetes is configured to use these network plugins.

## CNI and Kubernetes
As discussed in the prerequisite post, CNI defines the responsibilities of the container runtime. In Kubernetes, the container runtime is responsible for:
- Creating container network namespaces.
- Identifying and attaching those namespaces to the appropriate network by invoking the correct network plugin.

### Specifying CNI Plugins in Kubernetes
So, where do we specify the CNI plugins for Kubernetes to use? The CNI plugin must be invoked by the component within Kubernetes responsible for creating containers. This component must then call the appropriate network plugin after the container is created.

### Container Runtimes
The component responsible for creating containers is the container runtime. Examples of container runtimes include:
- **Containerd**
- **CRI-O**

(Note: Docker was the original container runtime, but it was later replaced by Containerd as an abstraction, which we explained in earlier posts.)

### Configuring Network Plugins
There are many network plugins available today. How do you configure these container runtimes to use a specific plugin?

1. **Plugin Installation Location:** All network plugins are installed in the directory `/opt/cni/bin`. This is where container runtimes locate the plugins.
  
2. **Plugin Configuration:** The configuration for which plugin to use and how to use it is found in the directory `/etc/cni/net.d`. This directory contains multiple configuration files, each responsible for configuring a particular plugin.

### Exploring the CNI Configuration Files
If you look at the `/opt/cni/bin` directory, you'll find all supported CNI plugins as executables, such as `bridge`, `DHCP`, `flannel`, etc. The CNI configuration directory (`/etc/cni/net.d`) contains a set of configuration files that the container runtime uses to determine which plugin to employ. 

For example, it might find the configuration file for the `bridge` plugin. If there are multiple configuration files, the runtime will select the one in alphabetical order.

#### Example: Bridge Plugin Configuration
If you examine the bridge configuration file, it may look like this:

```
cat /etc/cni/net.d/10-bridge.conf

{
  "cniVersion": "0.2.0",
  "name": "mynet",
  "type": "bridge",
  "bridge": "cni0"
  "ipGateway": true,
  "ipMasg": true,
  "ipam": {
    "type": "host-local",
    "subnet": "10.22.0.0"/16,
    "routes": [
      { "dsL": "0.0.0.0/0" }
    ]
  }
}
```