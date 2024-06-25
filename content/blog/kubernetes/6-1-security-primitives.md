---
title: K8s 6.1 - Security Primitives
date: 2024-05-19T07:07:07
summary: Essential Security Measures in Kubernetes
---
This section will be about the various security primitives at a high level overview. Let's begin with the hosts that form the cluster itself. 
- All access to these hosts must be secured; route access disabled, password-based authentication disabled, and only <mark>SSH key-based authentication to be made available.</mark>
- You must also take any measures to secure your physical or virtual infrastructure that hosts Kubernetes. 

What exactly are the risks, and what measures do you need to take to secure the cluster? 

As we have seen already, the KubeAPI Server is at the center of all operations within Kubernetes. We interact with it through the `kubectl` utility or by accessing the API directly, and through that you can perform almost any operation on the cluster. 
- So controlling access to the API server itself is the first line of defense. We need to make two types of decisions: 
1) Who can **access** the cluster?
2) What are they **allowed to do**, i.e. what **permissions**?

### Access to the Kube API Server
Access to the API server is defined by the authentication mechanisms. There are different ways that you can authenticate to the API server: 
- User IDs & Passwords/Tokens stored in static files
- **Certificates**
- Integration with external **authentication providers** like LDAP
- For the machines that access the cluster, we create **service accounts.**
### Permissions
Once users gain access to the cluster, what they are allowed to do is defined by authorization mechanisms. Authorization is generally implemented using **Role-Based Access Control (RBAC)** where users are associated to groups with specific permissions. Other methods include...
- **Attribute-Based Access Control (ABAC):** access decisions are based on attributes associated with the user, the resource being accessed, and the environment.
- **Node Authorization:** a security feature in Kubernetes that controls which nodes are allowed to join the cluster and communicate with the API server
- **Webhook mode:** a mechanism in Kubernetes that allows external systems to participate in the authorization process by making authorization decisions based on custom logic.
There are several other methods which will be discussed later on.

All communication with the cluster between the various components such as the ETCD cluster, the kube-controller-manager, scheduler, API server, as well as those running on the worker nodes such as the Kubelet and the kube-proxy is <mark>secured using TLS encryption</mark>.
![Security Primitives](/images/kubernetes/diagrams/6-1-1-tls.png)


What about communication between applications *within* the cluster? 
- By default, all Pods can access all other Pods within the cluster. You can restrict access between them using **network policies**.