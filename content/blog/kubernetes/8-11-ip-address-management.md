---
title: K8s 8.11 - IP Address Management in Kubernetes
date: 2024-08-20T07:07:07
summary: An exploration of how IP address management is handled in Kubernetes, focusing on CNI plugins and the Weave CNI plugin.
type: "blog"
---

In this post, we discuss IP address management within Kubernetes. Specifically, we'll explore how IP addresses are assigned to virtual bridge networks in nodes and how pods receive their IP addresses. This section does not cover the IP addresses assigned to the nodes in the network, which can be managed independently or with external IPAM solutions. Instead, we'll focus on how Kubernetes handles IP assignment within the cluster.

## Responsibility for IP Address Management
Let's start with the question of responsibility: Who is in charge of IP address management? According to the Container Network Interface (CNI) standards, it is the responsibility of the CNI plugin, or the network solution provider, to handle the assignment of IP addresses to containers.

CNI PLugin Responsibilities include:
- Must support arguments ADD/DEL/CHECK
- Must support parameters container id, network ns, etc. 
- Must manage IP Address assignment to PODs
- Must return reults in a specific format

### Custom CNI Plugin
Earlier, we built a basic CNI plugin that managed the assignment of IP addresses within the plugin itself. There was a section dedicated to assigning an IP address to the container network namespace.

```
#!/bin/bash

COMMAND=$1  # "add" or "delete"
NAMESPACE=$2
POD_IP=$3
BRIDGE="v-net-0"
GATEWAY="10.244.1.1"

case "$COMMAND" in
  "add")
    # Create veth pair
    ip link add veth0 type veth peer name veth1

    # Attach veth0 to the bridge
    ip link set veth0 master $BRIDGE
    ip link set veth0 up

    # Move veth1 to container namespace
    ip link set veth1 netns $NAMESPACE

    # Configure veth1 inside container namespace
    ip -n $NAMESPACE addr add $POD_IP/24 dev veth1
    ip -n $NAMESPACE route add default via $GATEWAY
    ip -n $NAMESPACE link set veth1 up
    ;;
  "delete")
    # Find and delete veth pair by name
    ip link delete veth0
    ;;
esac
```

But how do we ensure proper management of these IPs?

Kubernetes doesn't dictate how this should be done; it only requires that we manage IP addresses properly, avoiding duplicate assignments.

### Local IP Management
One straightforward method is to store a list of IPs in a file on each host. This file manages the IPs for pods on that node, and our script should include the necessary code to handle this file correctly. e.g.: 

ip-list.txt (on Node 1)
```
IP          STATUS      POD
10.244.1.2  ASSIGNED    BLUE
10.244.1.3  ASSIGNED    ORANGE 
10.244.1.4  FREE
```

ip-list.txt (on Node 2)
```
IP          STATUS      POD
10.244.2.2  ASSIGNED    PURPLE
10.244.2.3  FREE     
10.244.2.4  FREE
```

etc.

You could then use the IP list by fetching it in a function in the script
```
...
ip = get_free_ip_from_file()

# Configure veth1 inside container namespace
ip -n $NAMESPACE addr add $POD_IP/24 dev veth1
ip -n $NAMESPACE route add default via $GATEWAY
ip -n $NAMESPACE link set veth1 up

```
Instead of coding this from scratch, CNI offers two built-in plugins that can handle this task.

The plugin that implements local IP management on each host is the **host-local** plugin. However, it is still our responsibility to invoke this plugin in our script, or we can make the script dynamic to support different plugins.

```
...
ip = get_free_ip_from_host_local()

# Configure veth1 inside container namespace
ip -n $NAMESPACE addr add $POD_IP/24 dev veth1
ip -n $NAMESPACE route add default via $GATEWAY
ip -n $NAMESPACE link set veth1 up

```

### CNI Configuration File: IPAM Section
As you may have seen in the previous posts, the CNI configuration file includes a section called **IPAM** (IP Address Management), where we can specify the type of plugin to use, the subnet, and the routes. 

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
    "type": "host-local", # Type of plugin
    "subnet": "10.22.0.0"/16,
    "routes": [
      { "dsL": "0.0.0.0/0" }
    ]
  }
}
```

Our script can read these details and invoke the appropriate plugin, rather than hardcoding it to use the host-local plugin every time.

## IP Address Management in Weave CNI
Different network solution providers manage IP addresses differently. Let's look at how Weaveworks handles IP addresses.

By default, Weave allocates the IP range `10.32.0.0/12` for the entire network. This range provides IPs from `10.32.0.1` to `10.47.255.254`, giving you around a million IP addresses for pods on the network.

Weave peers automatically split this IP range equally among themselves, assigning a portion to each node. Pods created on these nodes receive IPs within the assigned range. These IP ranges are configurable with additional options during the deployment of the Weave plugin to a cluster.

![CNI Weave](/images/kubernetes/diagrams/8-11-1-ipam.png)
