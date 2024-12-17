---
title: K8s 8.7 - Cluster Networking
date: 2024-06-19T07:07:07
summary: Brief overview of how networking works in a Kubernetes cluster
type: "blog"
---

The Kubernetes cluster consists of master and worker nodes, each requiring specific network setups. 

### Network Requirements for Nodes
1. **Network Interfaces**:
   - Each node must have at least one interface connected to a network.
   - Each interface must have a configured address.

2. **Host Configuration**:
   - Each host must have a unique hostname and a unique MAC address.
   - Ensure uniqueness, especially if VMs were cloned from existing ones.

![Docker Networking](/images/kubernetes/diagrams/8-7-1-cluster-networking.png) 

### Port Configurations
Various ports must be opened for different components in the control plane:


- **API Server**: Port `6443` 
   - Accessed by worker nodes, kube control tool, external users, and all other control plane components.

![Docker Networking](/images/kubernetes/diagrams/8-7-2-cluster-networking.png) 

- **Kubelet**: Port `10250`
  - Kubelets can be present on both master and worker nodes.
- **Kube Scheduler**: Port `10259`
- **Kube Controller Manager**: Port `10257`
- **Service Exposure**: Ports `30000-32767`
- **ETCD Server**: Port `2379`

![Docker Networking](/images/kubernetes/diagrams/8-7-3-cluster-networking.png) 

**Multiple Master Nodes**:
   - Open the same ports as a single master node.
   - Additional Port `2380` for ETCD clients to communicate.

![Docker Networking](/images/kubernetes/diagrams/8-7-4-cluster-networking.png) 


These port configurations are crucial and listed in the Kubernetes documentation.
https://kubernetes.io/docs/reference/networking/ports-and-protocols/

Therefore, when setting up networking for your nodes, consider the following:
- Configuring firewalls, IP table rules, or network security groups in cloud environments like GCP, Azure, or AWS.
- Ensuring these configurations to troubleshoot networking issues.