---
title: K8s 6.4 - TLS in K8s
date: 2024-05-22T07:07:07
summary: A comprehensive guide on implementing Transport Layer Security(TLS) in K8s
type: "blog"
---
In the last post, we learned about server certificates, also known as **serving certificates**, which use public and private keys to secure connections. We also discussed Certificate Authorities (CAs) and their **root certificates**, which they use to sign **server certificates**. Additionally, we explored how servers can ask clients to verify themselves using **client certificates**. So, in summary, there are three types of certificates: 
- Server certificates for servers
- Root certificates for CAs
- Client certificates for clients.

Here's a way to think of which types of certificates use which file exstensions:

| Certificate (public key)<br>\*.crt \*.pem | **Private Key**<br>\*.key \*-key.pem |
| ----------------------------------------- | ------------------------------------ |
| server.crt                                | server.key                           |
| server.pem                                | server-key.pem                       |
| client.crt                                | client.key                           |
| client.pem                                | client-key.pem                       |

- Private keys usually have the word 'key' in them, either as an extension or in the name of the certificate. 
- Public keys usually don't have the word 'key' in them.

We will now see how these concepts relate to a Kubernetes cluster. 

![TLS in Kubernetes](/images/kubernetes/diagrams/6-4-1-tls-in-kubernetes.png)

- The Kubernetes cluster consists of a set of master and worker nodes. All communication **between these nodes** and **interactions between all services and their clients** need to be secure and encrypted.
	- For example, an administrator interacting with the Kubernetes cluster through the `kubectl` utility or while accessing the Kubernetes API directly must establish secure TLS connection.
- Communication between all the components within the Kubernetes cluster also need to be secured.
	- In the example above you can see the connection between the kube-scheduler and the kube-api is secured through some form of encryption.

So the two primary requirements are to
1) Have all the various services within the cluster to use server certificates 
2) All clients to use client certificates to verify they are who they say they are. 

## Server Components
Let's look at the different components within the Kubernetes cluster and identify the various servers and clients and who talks to who. 

![TLS in Kubernetes](/images/kubernetes/diagrams/6-4-2-tls-in-kubernetes.png)

Starting with the KubeAPI Server, like the bank server from the previous post, the API server exposes an HTTPS service that other components, as well as external users, use to manage the Kubernetes cluster. 
- Just like the bank server from the previous post, the Kube API server requires **certificates** to secure all communication with its clients, so we generate a certificate and key pair: APIserver.cert and APIserver.key. (We will try to stick to this naming convention going forward, where anything with a .CRT extension is the certificate and .key extension is the private key)
- Remember, these certificate names could be differentdepending on who and how the cluster was set up, so these names may be different in yours.

Another server in the cluster is the ETCD server. The ETCD server stores all information about the cluster, so it requires a pair of certificate and key for itself. 
- We will call it etcdserver.crt and etcdserver.key. 

The other server component in the cluster is on the worker nodes, which is run with the kubelet services. They also expose an HTTPS API endpoint that the kube-apiserver talks to interact with the worker nodes. 
- Again, that requires a certificate and key pair. We call it kubelet.cert and kubelet.key.
## Client Components
Let's now look at the client components. Who are the clients who access these services? 

![TLS in Kubernetes](/images/kubernetes/diagrams/6-4-3-tls-in-kubernetes.png)

The clients who access the kube-apiserver are us, the **administrators** through kubectl REST API. 
- The admin user requires a certificate and key pair to authenticate to the kube-API server. 
- We will call it admin.crt, and admin.key. 

The **scheduler** talks to the kube-apiserver to look for pods that require scheduling and then get the API server to schedule the pods on the right worker nodes. 
- The scheduler is a client that accesses the kube-apiserver. As far as the kube-apiserver is concerned, the scheduler is just another client, like the admin user. 
- The scheduler needs to validate its identity using a client TLS certificate, so it needs its own pair of certificate and keys. 
- We will call it scheduler.cert and scheduler.key. 

The **Kube Controller Manager** is another client that accesses the kube-apiserver, so it also requires a certificate for authentication to the kube-apiserver.

The **kube-proxy** requires a client certificate to authenticate to the kube-apiserver, and so it requires its own pair of certificate and keys.
- We will call them kubeproxy.crt, and kubeproxy.key.

The servers within the Kubernetes cluster communicate with each other as well. For instance, the kube-apiserver interacts with the ETCD server. 
- Notably, among all the components, the kube-apiserver exclusively communicates with the ETCD server. 
- Consequently, from the perspective of the ETCD server, the kube-apiserver acts as a client and thus requires authentication. To achieve this, <mark>the kube-apiserver can utilize the same credentials used for its API service, namely the APIserver.crt and APIserver.key files. </mark>
- Alternatively, **new certificates** can be generated specifically for the kube-apiserver's authentication with the ETCD server.
- Additionally, the kube-apiserver communicates with the kubelet server on each individual node to monitor worker nodes. Once more, it has the option to employ existing certificates or create new ones tailored for this purpose.

That seems like quite a lot of certificates to manage. Let's simplify things by categorizing them. 

![TLS in Kubernetes](/images/kubernetes/diagrams/6-4-4-tls-in-kubernetes.png)

- We have a collection of **client certificates** primarily utilized by clients <mark>to establish connections with the kube-apiserver.</mark>
- Additionally, there's a separate set of **server-side certificates** employed by the kube-apiserver, ETCD server, and kubelet <mark>to authenticate the clients connecting to them.</mark>

We will now see how to generate these certificates. As we know already, we need a certificate authority to sign all of these certificates. Kubernetes requires you to have at least one certificate authority for your cluster. 
- In fact, you can have more than one. One for all the components in the cluster and another one specifically for ETCD. 
![TLS in Kubernetes](/images/kubernetes/diagrams/6-4-5-tls-in-kubernetes.png)
- In that case, the ETCD servers certificates and the ETCD servers client certificates, which in this case is the API server client certificate, will be all signed by the ETCD server CA. 
- For now, we will stick to just one CA for our cluster. The CA, as we know, has its own pair of certificate and key. We will call it CA.crt and CA.key. 
![TLS in Kubernetes](/images/kubernetes/diagrams/6-4-6-tls-in-kubernetes.png)
