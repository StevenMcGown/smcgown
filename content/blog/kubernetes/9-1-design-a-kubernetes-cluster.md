---
title: K8s 9.1 - Designing a Kubernetes Cluster
date: 2024-08-25T07:07:07
summary: Key considerations for designing a Kubernetes cluster, including purpose, workloads, cloud adoption, and deployment options.
type: "blog"
---

Designing a Kubernetes cluster requires careful planning to ensure it meets the needs of your workloads, organizational goals, and operational environment. Before starting, consider the following critical questions:

- **Purpose**: Is the cluster for learning, development, testing, or hosting production-grade applications?
- **Cloud Adoption**: Does your organization prefer a managed cloud platform or a self-hosted solution?
- **Workloads**: What types of applications will the cluster host (e.g., web applications, big data, analytics)? How many applications will run concurrently?
- **Traffic**: Will the applications experience continuous heavy traffic or bursty patterns?

## Purpose-Driven Cluster Design

### Learning and Development Clusters

For learning purposes, simple setups like **Minikube** or single-node clusters deployed using **kubeadm** on local virtual machines or cloud platforms (e.g., AWS, GCP) are sufficient. These solutions are lightweight, easy to set up, and perfect for beginners.

For development and testing, a small multi-node cluster with a single control plane node and multiple worker nodes is more suitable. Tools like `kubeadm` can be used to create such clusters. Managed services like Google Kubernetes Engine (GKE), Amazon EKS, or Azure Kubernetes Service (AKS) simplify the process further by handling much of the underlying complexity.

### Production-Grade Clusters in the Cloud

Production environments require highly available, multi-node clusters with multiple control plane nodes. These setups ensure redundancy and can handle large-scale workloads. Key production cluster limitations include:

- **Node Limit**: Up to 5,000 nodes.
- **Pod Limit**: 150,000 pods (or 100 pods per node).
- **Container Limit**: 300,000 containers.

Managed services such as GKE, EKS, and AKS simplify cluster management by automatically provisioning appropriately sized nodes to match your cluster's scale and workload requirements. This streamlines the process and ensures optimal performance. The table below illustrates example instance types you might consider provisioning in an AWS environment based on the number of nodes in your cluster.

| Number of Nodes | AWS EC2 Instance Type | CPU & Memory          |
|------------------|------------------------|-----------------------|
| 1-5              | m3.medium             | 1 vCPU, 3.75 GB RAM   |
| 6-10             | m3.large              | 2 vCPU, 7.5 GB RAM    |
| 11-100           | m3.xlarge             | 4 vCPU, 15 GB RAM     |
| 101-250          | m3.2xlarge            | 8 vCPU, 30 GB RAM     |
| 251-500          | c4.4xlarge            | 16 vCPU, 30 GB RAM    |
| > 500            | c4.8xlarge            | 36 vCPU, 60 GB RAM    |

These resource allocations may also apply if you're planning an on-prem deployment.

- **Google Cloud**: GKE offers a seamless Kubernetes experience with features like automatic upgrades and easy scaling.
- **AWS**: Use `kOps` to deploy robust Kubernetes clusters with high availability.
- **Azure**: Azure Kubernetes Service (AKS) provides a managed Kubernetes environment with built-in integration into Azure’s ecosystem.
---
## On-Prem Deployments

For self-hosted environments, tools like `kubeadm` are ideal for building clusters from scratch. This approach provides full control over the cluster configuration but requires more manual effort and maintenance.

### Node and Storage Configuration

The *type* of workloads determines the necessary node specifications and storage solutions:

- **Performance**: Use SSD-backed storage for high-performance applications.
- **Concurrency**: Opt for network-based storage for workloads with multiple concurrent accesses.
- **Shared Storage**: Leverage persistent storage volumes for data sharing across pods.
- **Storage Classes**: Define storage classes to ensure workloads receive the appropriate storage resources.

Nodes in a Kubernetes cluster can be either virtual or physical. Virtual machines, such as those running on VirtualBox, are often used for testing and development environments. Alternatively, clusters can be deployed on physical hardware or hosted on cloud platforms like AWS, Azure, or GCP, depending on the specific requirements.

### Master and Worker Nodes

As we've learned before, a typical cluster consists of two types of nodes: control plane nodes (masters) and worker nodes:

- **Master Nodes**:
  - Responsible for core control components like the API server and `etcd`.
  - Best practices discourage running workloads on master nodes in production.
  - Tools like `kubeadm` enforce this by applying taints to master nodes.

- **Worker Nodes**:
  - Handle application workloads, ensuring scalability and resilience.

In this setup, we will create a cluster with **one master node** and **two worker nodes**.

### High Availability and Scaling

To ensure high availability, production clusters often adopt the following strategies:

- Separate `etcd` onto dedicated nodes.
- Distribute control plane components across multiple master nodes for redundancy.

These advanced topologies will be explored in a future post dedicated to high-availability cluster setups.