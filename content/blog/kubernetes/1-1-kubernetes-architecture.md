---
title: K8s 1.1 - Introduction to K8s
date: 2024-04-04T07:07:07+01:00
summary: Introduction & Overview of K8s Administration
type: "blog"
---

Welcome to this introductory post on Kubernetes! In this series, I will provide a comprehensive overview of managing a Kubernetes cluster. If you have any questions or suggestions, please click "Suggest Changes" at the top of this post to share your feedback.

Kubernetes (often abbreviated as K8s) is an open-source container orchestration platform that automates the deployment, scaling, and management of containerized applications. The Kubernetes Cluster Architecture is designed to offer a scalable, resilient, and flexible environment for running containerized workloads. Below is an in-depth look at the key components of a typical Kubernetes cluster architecture:

![k8s architecture](https://kubernetes.io/images/docs/kubernetes-cluster-architecture.svg)

### Master Node
The Master Node is responsible for managing, planning, scheduling, and monitoring the nodes within the cluster. It consists of several critical components:

- **ETCD Cluster:** A highly available key-value store that is used for all cluster data, including information about the cluster's state, configuration details, and metadata. The ETCD cluster listens for instructions from the Kube API Server.
  
- **Kube Controller Manager:** This component handles various controller functions such as node lifecycle management, replication, and endpoint tracking. It ensures that the desired number of replicas for a given application are running at all times, and manages the lifecycle of nodes, ensuring they are added or removed correctly.

- **Kube API Server:** The core component of the master node, the Kube API Server exposes the Kubernetes API. It orchestrates all operations within the cluster by processing RESTful requests, validating them, and executing them. It acts as the gateway for all administrative tasks, including monitoring the state of the cluster and making necessary changes.

### Worker Node
Worker Nodes are responsible for hosting and running the applications in the form of containers. Each worker node includes the following components:

- **Kubelet:** An agent that runs on each worker node, the Kubelet ensures that containers are running in a Pod. It receives Pod definitions from the Kube API Server and manages the containers' lifecycle based on the resource requirements and constraints specified in the Pod specifications.

- **Container Runtime Engine:** This component is responsible for running the containers. Common container runtime engines include Docker, containerd, and CRI-O. The container runtime engine pulls container images, starts, and stops containers as instructed by the Kubelet.

- **Kube Proxy:** A network proxy that runs on each worker node, Kube Proxy maintains network rules and facilitates communication between services within the cluster. It ensures that each node has the necessary rules to allow the containers to communicate with each other and with the external world.

Kubernetes provides a robust framework for managing containerized applications at scale. Its architecture ensures high availability, scalability, and ease of management, making it an essential tool for modern DevOps practices.

Stay tuned for the next post in this series, where we will delve deeper into the specifics of each component and how they work together to form a cohesive Kubernetes cluster. If you have any questions or suggestions, feel free to reach out by clicking "Suggest Changes" at the top of this post.
