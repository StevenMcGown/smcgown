---
title: K8s 7.3 - Container Storage Interface (CSI)
date: 2024-06-08T07:07:07
summary: Understanding & Implementing the Container Storage Interface in Kubernetes
---
As we discussed before in [[1.2 - Docker vs. ContainerD]], in the past, Kubernetes used Docker alone as the container runtime engine, with all the code to work with Docker embedded within the Kubernetes source code. However, as other container runtimes like RKT and CRI-O emerged, it became important to extend support for different container runtimes without being dependent on the Kubernetes source code. This led to the development of the Container Runtime Interface (CRI).

![CSI](/images/kubernetes/diagrams/7-3-1-container-storage-interface.png)

The **CRI** is a standard that defines how orchestration solutions like Kubernetes communicate with container runtimes like Docker. With CRI, any new container runtime can work with Kubernetes by following the CRI standards, eliminating the need to modify Kubernetes source code or collaborate directly with the Kubernetes development team.

### Container Networking Interface (CNI)

Similar to CRI, the Container Networking Interface (CNI) was introduced to extend support for different networking solutions. Networking vendors can develop their plugins based on CNI standards, making their solutions compatible with Kubernetes.

![CSI](/images/kubernetes/diagrams/7-3-2-container-storage-interface.png)

The **Container Networking Interface (CNI)** is a set of standards for configuring network interfaces in Linux containers. CNI allows Kubernetes to support different networking solutions in a modular and interoperable manner. By adhering to CNI standards, various network providers can create plugins that work seamlessly with Kubernetes, enabling users to choose from a variety of networking solutions.
### Container Storage Interface (CSI)

To support multiple storage solutions, the Container Storage Interface (CSI) was developed. With CSI, developers can write their own drivers for various storage systems to work with Kubernetes.
- Popular storage solutions like Portworx, Amazon EBS, Azure Disk, Dell EMC Isilon, PowerMax, Unity, XtremIO, NetApp, Nutanix, HPE, Hitachi, and Pure Storage have their own CSI drivers.

![CSI](/images/kubernetes/diagrams/7-3-3-container-storage-interface.png)

CSI is not specific to Kubernetes. It is a universal standard that, when implemented, allows any container orchestration tool to work with any storage vendor with a supported plugin. 
- Currently Kubernetes, Cloud Foundry, and Mesos are on board with CSI.

### How CSI Works

CSI defines a set of commands, called Remote Procedure Calls (RPCs), that storage drivers must implement. For example:
- **Create Volume RPC**: When a pod requiring a volume is created, Kubernetes calls the `CreateVolume` RPC, passing details such as the volume name. The storage driver handles this request, provisions a new volume on the storage array, and returns the result.
- **Delete Volume RPC**: When a volume is to be deleted, Kubernetes calls the `DeleteVolume` RPC. The storage driver then decommissions the volume from the array.
- **ControllerPublishVolume RPC**: When a volume needs to be attached to a node (a machine in the Kubernetes cluster), Kubernetes sends a `ControllerPublishVolume` command to the storage driver. The storage driver then attaches the volume to the specified node and confirms the operation.

The CSI specification details the parameters that should be sent by the caller, what should be received by the solution, and the error codes to be exchanged.

For more details, you can view the CSI specification on GitHub here: https://github.com/container-storage-interface/spec
