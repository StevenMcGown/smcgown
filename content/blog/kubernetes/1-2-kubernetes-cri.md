---
title: K8s 1.2 - Kubernetes Container Runtime Interface (CRI)
date: 2024-04-05T07:07:07+01:00
summary: Understanding the CRI and its Components
type: "blog"
---

Welcome back to this series on Kuberenets Administration. In this post, we talk about the purpose of the Container Runtime Interface.

Kubernetes was initially designed to orchestrate Docker containers. However, with the emergence of other container runtimes like **rkt**, there was a need for Kubernetes to support multiple container runtimes. To address this, Kubernetes introduced the Container Runtime Interface (CRI), allowing any container runtime that adheres to the Open Container Initiative (OCI) specifications to run on Kubernetes. The OCI includes two main specifications:

- **imagespec**: Specifications on how a container image should be built.
- **runtimespec**: Specifications on the runtime behavior of containers.

Docker operated outside of the CRI, necessitating the creation of **Dockershim** to enable Docker's compatibility with Kubernetes. However, starting with Kubernetes version 1.24, support for Docker through Dockershim was discontinued. Despite this, containers built by Docker remain compatible with Kubernetes through other container runtimes.

![DockervsContainerD](/images/kubernetes/diagrams/1-2-1-docker-vs-containerd.png)

ContainerD, originally part of Docker, has evolved into an independent project and can now run without Docker. Tools like `ctr` and `runc` are used to interact with ContainerD:

- **`ctr`**: A command-line tool used solely for debugging ContainerD. It is not user-friendly and should not be used in production environments.
- **`runc`**: A CLI for ContainerD that supports most features provided by Docker, along with new features implemented into ContainerD, such as:
  - Encrypted container images.
  - Lazy pulling of images.
  - P2P image distribution.
  - Image signing and verifying.
  - Namespaces in Kubernetes. For example:
    ```ell
    $ docker run --name redis redis:alpine -> nerdctl run --name redis redis:alpine
    ```

Additionally, `crictl` is a CLI tool designed to interact with CRI-compatible container runtimes. It is installed separately and is primarily used to inspect and debug container operations, rather than to create containers. Key points about `crictl` include:

- **`crictl`**: Works across various container runtimes, providing a standard interface for interacting with CRI-compatible runtimes.
- **`nerdctl`**: Developed by the ContainerD community, it provides similar functionality to `crictl` but is more focused on ContainerD.
- **Kubelet Compatibility**: `crictl` works alongside the Kubelet, which ensures that the appropriate number of containers or pods are running on a node. It is important to note that any container created by `crictl` will be deleted by Kubelet if it is unaware of its creation. Therefore, `crictl` should be used strictly for debugging purposes.

By understanding the CRI and its components, you can effectively manage and troubleshoot container runtimes within a Kubernetes cluster. Stay tuned for the next post in this series, where we will delve deeper into the practical aspects of using these tools in a Kubernetes environment.
