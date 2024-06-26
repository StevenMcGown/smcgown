---
title: K8s 1.3 - ETCD in K8s
date: 2024-04-06T07:07:07+01:00
summary: In-depth Overview of ETCD and Its Role in Kubernetes
type: "blog"
---

Welcome back to this series on Kubernetes Administration. In this post, we will delve into the role of ETCD in Kubernetes clusters, exploring its key features, setup methods, and how it integrates with the overall Kubernetes architecture.

ETCD is a crucial component of Kubernetes, acting as a highly available and distributed key-value store that holds all the data related to the cluster. This includes information about nodes, pods, configurations, secrets, accounts, roles, bindings, and more. Here’s an in-depth look at ETCD and how it integrates with Kubernetes:

### Key Features of ETCD

- **Cluster State Storage**: ETCD stores the entire state of the Kubernetes cluster. Any changes made within the cluster, such as adding nodes or deploying pods, are reflected in the ETCD store.
- **API Versions**: ETCD has different API versions, with significant changes between versions 2 and 3. It’s important to use the correct version for your operations:
  - **Setting Values**: Use the command `$ etcdctl set key value` to store data.
  - **Retrieving Values**: Use the command `$ etcdctl get key` to retrieve data.
  - **API Version Control**: Switch to API version 3 by setting the environment variable `$ export ETCDCTL_API=3`.

All information obtained using the `$ kubectl get` command comes from the ETCD server. This ensures that any queried data is up-to-date and reflects the current state of the cluster.

### Setting Up ETCD

There are two primary ways to set up ETCD in a Kubernetes cluster:

1. **Manual Setup**:
   - Download the ETCD binary and configure it as a service on the master node.
   - This method requires manual configuration and management of the ETCD service.

2. **Using Kubeadm**:
   - The Kubeadm tool simplifies the setup by deploying the ETCD server as a pod within the `kube-system` namespace.
   - This approach is automated and integrates seamlessly with other Kubernetes components.

### Managing ETCD Data

ETCD is critical for storing all Kubernetes cluster data. Here’s how to manage and interact with ETCD effectively.


To list all keys stored in ETCD, use:

```
$ kubectl exec etcd-master -n kube-system -- etcdctl get / --prefix --keys-only
```

The directory structure in ETCD starts with the root as the registry. It contains values for Kubernetes constructs such as minions, pods, replicasets, deployments, roles, and secrets. You can see below that many of these resources are grouped by namespaces as well, which we will look more into later.
```
/
└── registry
    └── minions
    │   ├── node1
    │   ├── node2
    │   └── node3
    ├── pods
    │   └── namespace1
    │   │   ├── pod1
    │   │   └── pod2
    │   └── namespace2
    │   │   ├── pod1
    │   │   └── pod2
    ├── replicasets
    │   └── namespace1
    │   │   ├── replicaset1
    │   │   └── replicaset2
    │   └── namespace2
    │   │   ├── replicaset1
    │   │   └── replicaset2
    │   ├── namespace1
    │   │   ├── deployment1
    │   │   └── deployment2
    │   └── namespace2
    │       ├── deployment1
    │       └── deployment2
    ...
```

### High Availability and ETCD
In a high-availability Kubernetes cluster, there are multiple ETCD instances spread across each master node. These instances need to be aware of each other to maintain consistency and reliability. This is achieved by setting the --initial-cluster option in all ETCD controllers.

### Summary
ETCD is a foundational component of Kubernetes, ensuring that the state of the cluster is reliably stored and easily accessible. Whether setting up manually or using Kubeadm, understanding ETCD’s role and functionality is essential for effective Kubernetes administration. Stay tuned for further insights into Kubernetes components and best practices for cluster management.