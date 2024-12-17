---
title: K8s 8.6 - Container Network Interfaces
date: 2024-06-18T07:07:07
summary: Overview of Container Network Interfaces for Kubernetes
type: "blog"
---

### Network Namespaces and Container Networking

So far, we have explored how network namespaces work, including creating an isolated network namespace environment within our system. Here's a summary of what we've covered:
Ecauxpg73#
**Connecting Namespaces**:
1) Create multiple networking namespaces.
2) Connect them through a bridge network.
3) Create virtual cables or pipes with virtual interfaces on either end.
4) Attach each end of the vEth to the namespace and the bridge.
5) Assign IP addresses and bring them up
6) enable NAT or IP masquerade for external communication.

Docker's bridge networking option uses similar principles but different naming patterns. Other container solutions, like Rocket, Mesos Containerizer, and Kubernetes, implement networking similarly.

### Standardizing Networking Solutions

Given that various container solutions tackle similar networking challenges, why develop multiple solutions? Why not create a single standard approach for everyone to follow? This is where the concept of a unified program for networking, called **BRIDGE **, comes in:

- **Bridge Program**: 
  - A program or script that performs all tasks to attach a container to a bridge network.
  - Container runtime environments call the Bridge program to handle networking configuration.

For example, using the bridge program to add a namespace, you could do `$ bridge add <cid> <namespace>
`
```
$ bridge add 9ba3541a137c /var/run/nens/9ba3541a137c
```

### Developing a Standard Program

If you wanted to create a similar program for a new networking type, you would need to consider:

- Supported arguments and commands.
- Ensuring compatibility with container runtimes like Kubernetes or Rocket.

### Introduction to Container Network Interface (CNI)

To address these challenges, CNI (Container Network Interface) provides a set of standards for developing networking solutions in container runtime environments. Here’s how it works:

**CNI Requirements:**
1. Container Runtime must create a network namespace
2. Indentify network the container must attach to
3. Container Runtime to invoke Network PLugin (bridge) when container is ADDed.
4. Container Runtime to invoke Network PLugin (bridge) when container is DELeted.
5. JSON format of the Network Configuration

**Plugin Requirements**:
1. Must support `add`, `del`, and `check` commands.
2. Must support parameters container id, network ns, etc.
3. Handle IP assignment and routing for containers.
4. Results should be in a specified format.

## CNI Plugins

CNI includes several supported plugins, such as:

- Bridge, VLAN, IP VLAN, MAC VLAN
- IPAM plugins like Host Local and DHCP
- Third-party plugins like Weave, Flannel, Cilium, VMware NSX, Calico, Infoblox

These plugins work across any runtime that implements CNI standards, ensuring interoperability.

### Docker and CNI

Docker, however, does not implement CNI. Instead, it has its own standard called CNM (Container Network Model). Due to differences between CNI and CNM, <mark>Docker cannot natively use CNI plugins. Nonetheless, you can still use Docker with CNI by manually invoking the bridge plugin,</mark> similar to how Kubernetes handles Docker containers.


For example, **this will not work:**
```
$ docker run --network=cni-bridge nginx
```

Instead, you would create a container using Docker and then use the bridge command:
```
$ docker run --network=none nginx
$ bridge add 9ba3541a137c /var/run/nens/9ba3541a137c
```

### Conclusion

We will delve deeper into how CNI is used within Kubernetes in the upcoming posts.