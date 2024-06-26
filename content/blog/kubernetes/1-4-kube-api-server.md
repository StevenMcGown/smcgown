---
title: K8s 1.4 - The Kube API Server
date: 2024-04-07T07:07:07+01:00
summary: In-depth Over view of the Kube API Server
type: "blog"
---
### Kubernetes API and Kube API Server

The **Kubernetes API** (Application Programming Interface) is a crucial component of Kubernetes, providing a way for users, administrators, and external systems to interact with and control a Kubernetes cluster. This interface acts as the communication conduit through which various entities within the cluster, such as nodes, pods, services, and more, can be managed and manipulated.

Designed as a RESTful API, the Kubernetes API adheres to REST principles. This involves a stateless client-server communication model using standard HTTP methods (GET, POST, PUT, DELETE) and operates on resources identified by unique URLs.

The **Kube API Server** is the primary management component within Kubernetes. When you run a `$ kubectl` command, the `kubectl` utility reaches out to the Kube API Server. The Kube API Server first authenticates the request and validates it. It then retrieves the data from the ETCD Cluster and responds back with the requested information. It's not necessary to use the `kubectl` command line; you can also interact with the APIs directly.

#### Example: Creating a Pod via the Kube API Server

In this example, the Kube API Server creates a pod object without assigning it to a node.

![KubeAPIServer](/images/kubernetes/diagrams/1-4-1-kubeapiserver.png)


1. The user executes a command similar to:
```
$ curl -X POST api/v1/namespaces/pods/other
```
2. Through the Kube Controller Manager, the **Node Controller** continuously monitors the Kube API Server. The **Kube Scheduler** is informed through the **Kube API Server** that the user has requested to create a pod manually.
3. The scheduler then identifies which node to put the new pod on and communicates that back to the Kube API Server.
4. The Kube API Server updates the information in the ETCD cluster.
5. The API server then passes that information to the **kubelet** on the appropriate worker node.
6. The Kubelet creates the pod on the node and instructs the container runtime engine to deploy the application image.
7. Once done, the Kubelet informs the API server, which then...
8. Updates the ETCD Cluster.

#### Manual Installation of Kube API Server

If installing manually, the Kube API Server is a single component. Many of the options for the Kube API Server involve certificates. The ETCD server(s) is defined by options such as `--etcd-servers https://127.0.0.1`.

### Summary

The Kubernetes API and Kube API Server are essential for managing and orchestrating the various components of a Kubernetes cluster. Understanding their roles and how they interact with other components like ETCD, Kube Scheduler, and Kubelet is vital for effective Kubernetes administration.
