---
title: K8s 6.5 - TLS in K8s Certificate Creation
date: 2024-05-23T07:07:07
summary: Understanding and Implementing TLS Certificate Creation within Kubernetes
type: "blog"
---
In this post we will use `openssl` to generate certificates, but keep in mind there are other tools that you can use such as EasyRSA and CFSSL.

## Generating Key, CSR and Sign Certificate

Recall from the previous post that this is what we are creating:
![TLS in K8s](/images/kubernetes/diagrams/6-4-6-tls-in-kubernetes.png)

Let's start with the Certificate Authority (CA) Certificates. It's a 3-step process. 
1) First we **create a private key** using the OpenSSL command: 
	`$ openssl genrsa -out ca.key 2048` 
2) Then we use the OpenSSL Request command along with the key we just created to **generate a Certificate Signing Request** (CSR). `$ openssl req -new -key ca.key -subj "/CN=KUBERNETES-CA" -out ca.csr`
	- The certificate signing request is like a certificate with all of your details, but with no signature. 
	- In the certificate signing request we specify the name of the component the certificate is for in the **Common Name**, or `CN` field. In this case, since we are creating a certificate for the Kubernetes CA, we name it `KUBERNETES-CA` 
3) Finally, we **sign the certificate** using the `openssl x509` subcommand. This is a subcommand of OpenSSL used for working with x509 certificates, which are a standard format for public key certificates:
	`$ openssl x509 -req -in ca.csr -signkey ca.key -out ca.crt`
	- We specify the certificate signing request (CSR) we generated in the previous command, `ca.csr`. 
	- Since this is for the CA itself it is self-signed by the CA using its own private key that it generated in the first step. 
	- Going forward **for all other certificates we will use the CA key pair to sign them.** 
	- The CA now has its private key and root certificate file.
  ![TLS in K8s](/images/kubernetes/diagrams/6-5-1-tls-in-kubernetes.png)

## Configuring Client Certificates

Let's now look at generating the client certificates. We start with the admin user. It's a similar 3 step process as above, but this time we are using the CA root certificate and private key.
1) Create a private key for the admin user using the OpenSSL command. 
	`$ openssl genrsa -out admin.key 2048`
2) We then generate a CSR and that is where we specify the name of the admin user, which is Kube Admin, in the `CN` field. 
	`$ openssl req -new -key admin.key -subj "/CN=kube-admin" --out admin.csr`
	- The name of the CSR file does not have to kube-admin. It could be anything, but remember, this is the name that kubectl client authenticates with and when you run the `kubectl` command. So in the audit logs and elsewhere, this is the name that you will see.
3) Finally, **generate a signed certificate** using: `$ openssl x509 -req -in admin.csr -CA ca.crt -CAkey ca.key -out admin.crt`
	- This time you specify the CA certificate and the CA key. You're signing your certificate with the CA key pair which makes this a valid certificate within your cluster. 
	- The signed certificate is then output to `admin.crt` file. <mark>This is the certificate that the admin user will use to authenticate to the Kubernetes cluster.</mark>
![TLS in K8s](/images/kubernetes/diagrams/6-5-2-tls-in-kubernetes.png)

At this point, we have the following files, and their purposes:
1) **ca.key:** used to sign digital certificates issued by the CA. 
2) **ca.csr:** contains information (such as the public key) that is used to apply for a digital certificate.
3) **ca.crt:** used to verify the authenticity of digital certificates signed by the CA.
4) **admin.key:** the private key of a digital certificate issued to an administrative user or entity.
5) **admin.csr:** contains information (such as the public key) that is used to apply for a digital certificate for that user or entity.
6) **admin.crt:** contains information such as the user's identity, public key, and the CA's digital signature, which verifies the authenticity of the certificate.

Generating a key and certificate pair is akin to creating a non-admin account, where the certificate acts as the validated User ID and the key serves as the password, albeit much more secure. <mark>To differentiate the admin user from others, group details are added to the certificate.</mark>
- You can do this by adding group details with the OU parameter while generating the certificate signing request:
	`$ openssl req -new -key admin.key -subj "/CN=kube-admin/O=system:masters" -out admin.csr`
- In this case, a group named "system:masters" exists on Kubernetes with administrative privileges. 
	
Once it's signed, we now have our certificate for the admin user with admin privileges. We follow the same process to generate client certificates for all other components that access the Kube API server. Remember, there are **client** and **server** components:
![TLS in K8s](/images/kubernetes/diagrams/6-4-6-tls-in-kubernetes.png)

The next client component we will generate certificates for is the **kube-scheduler.** Again, pay attention to the information specified in the`-subj` flag. We follow the same 3-step process that we did for the admin certificate.
- The Certificate Name (CN) is `kube-scheduler` and the Organization (O) is `system:kube-scheduler`, meaning the kube-scheduler is a system component, part of the Kubernetes control pane, so its name must be prefixed with the keyword 'system'.
1) `$ openssl genrsa -out kube-scheduler.key 2048` 
2) `$ openssl req -new -key kube-scheduler.key -subj "/CN=kube-scheduler/O=system:kube-scheduler" -out kube-scheduler.csr`\
3) `$ openssl x509 -req -in kube-scheduler.csr -CA ca.crt -CAkey ca.key -out kube-scheduler.crt`
The same with kube-controller-manager. It's also a system component so its name must be prefixed with the keyword system.
1) `$ openssl genrsa -out kube-controller-manager.key 2048` 
2) `$ openssl req -new -key kube-controller-manager.key -subj "/CN=kube-controller-manager/O=system:kube-controller-manager" -out kube-controller-manager.csr`
3) `$ openssl x509 -req -in kube-controller-manager.csr -CA ca.crt -CAkey ca.key -out kube-controller-manager.crt`
And finally, kube-proxy.
1) `$ openssl genrsa -out kube-proxy.key 2048` 
2) `$ openssl req -new -key kube-proxy.key -subj "/CN=kube-proxy/O=system:kube-proxy" -out kube-proxy.csr`
3) `$ openssl x509 -req -in kube-proxy.csr -CA ca.crt -CAkey ca.key -out kube-proxy.crt`

So far we have created CA certificates, then all of the client certificates including the admin user, scheduler, controller-manager, and kube-proxy.
- We will follow the same procedure to create the remaining three client certificates for **API servers** and **kubelets** when we create the **server certificates** for them.

![TLS in K8s](/images/kubernetes/diagrams/6-5-3-tls-in-kubernetes.png)
## Using Certificates to Authenticate to K8s Cluster

Now, what do you do with these certificates? 
- Take the admin certificate, for instance, to manage the cluster. You can **use the certificate instead of a username and password** in a REST API call you make to the Kube API server. 
- You specify the key, the certificate, and the CA certificate as options. 
```
$ curl https://kube-apiserver:6443/api/v1/pods \
--key admin.key --cert admin.crt --cacert ca.crt
```
- This command might return something like this:
```
{
  "kind": "PodList",
  "apiVersion": "v1",
  "metadata": {
    "selfLink": "/api/v1/pods",
    "resourceVersion": "123456"
  },
  "items": [
    {
      "metadata": {
        "name": "example-pod",
        "namespace": "default",
        "labels": {
          "app": "example"
        }
      },
      "spec": {
        "containers": [
          {
            "name": "example-container",
            "image": "nginx:latest"
          }
        ]
      },
      "status": {
        "phase": "Running",
        "conditions": [
          {
            "type": "Ready",
            "status": "True"
          }
        ]
      }
    }
  ]
}

```

The other way is to move all of these parameters into a configuration file called kubeconfig. 
- Within that, specify the API server endpoint details, the certificates to use, et cetera. 

kube-config.yaml
```
apiVersion: v1
clusters:
- cluster:
	certificate-authority: ca.crt
	server: https://kube-apiserver:6443
  name: kubernetes
kind: Config
users:
- name: kubernetes-admin
  user:
    client-certificate: admin.crt
    client-key: admin.key
```
- That is what most of the Kubernetes clients use. We will look at kubeconfig in depth in one of the upcoming lectures.

Now, we have the server-side certificates remaining, but there's one more crucial point to address. As mentioned in the previous posts, <mark>both clients and servers must validate each other's certificates</mark>. This necessitates that all parties possess **a copy of the Certificate Authority's public certificate**. 
- In the case of web applications, this certificate is typically pre-installed in users' browsers. Similarly, <mark>in Kubernetes, for various components to authenticate each other, they must all possess a copy of the CA's root certificate</mark>. 
- Therefore, whenever configuring a server or client with certificates, it's essential to include the CA root certificate, as illustrated below.
![TLS in K8s](/images/kubernetes/diagrams/6-5-4-tls-in-kubernetes.png)


## Configuring Server Certificates

Now that we have configured some client certificates, we can look at configuring **server certificates**. Recall that **server-side certificates** are employed by the kube-apiserver, ETCD server, and kubelet <mark>to authenticate the clients connecting to them.</mark>

#### ETCD Server Certificates

Let's start with the ETCD server. 
- We follow the same procedure as before to generate a certificate for ETCD.  
1) `$ openssl genrsa -out etcdserver.key 2048` 
2) `$ openssl req -new -key etcdserver.key -subj "/CN=etcdserver/O=system:etcdserver" -out etcdserver.csr`
3) `$ openssl x509 -req -in etcdserver.csr -CA ca.crt -CAkey ca.key -out etcdserver.crt`

 ETCD server can be deployed as a cluster across multiple servers as in a high availability environment. In that case, to secure communication between the different members in the cluster, we must generate additional peer certificates. 
![TLS in K8s](/images/kubernetes/diagrams/6-5-5-tls-in-kubernetes.png)
1) `$ openssl genrsa -out etcdpeer1.key 2048` 
2) `$ openssl req -new -key etcdpeer1.key -subj "/CN=etcdserver/O=system:etcdpeer1" -out etcdpeer1.csr`
3) `$ openssl x509 -req -in etcdpeer1.csr -CA ca.crt -CAkey ca.key -out etcdpeer1.crt`
4) Repeat for each subsequent peer server

Once the certificates are generated, specify them while starting the ETCD server. 
- There are key and cert file options where you specify the ETCD server keys. 
- There are other options available for specifying the peer certificates. 
- And finally, as we discussed earlier, it requires the CA root certificate to verify that the clients connecting to the ETCD server are valid.

etcd.yaml
![Pasted image 20240309164225.png](/images/kubernetes/images/Pasted-image-20240309164225.png)

#### Kube API Server Certificates
Let's discuss the Kube API server. It's a central component in the cluster, handling all operations. Many aliases are used to refer to it, including:
- "kubernetes" 
- "kubernetes.default" 
- "kubernetes.default.svc" 
- "kubernetes.default.svc.cluster.local" 
- It is also referred to in some places simply by its IP address; The IP address of the host running the Kube API server or the pod running it.

<mark>All of these names must be present in the certificate generated for the Kube API server. Only then those referring to the Kube API server by these names will be able to establish a valid connection.</mark>

We use the same 3-step process as before to create a certificate, except this time when we create a certificate signing request, we pass a config file (openssl.cnf) as an option which contains all of the alternate names that the Kube API server goes by under the "alt_name" section.
- `$ openssl genrsa -out apiserver.key 2048`
- `$ openssl req -new -key apiserver.key -subj /CN=kube-apiserver -out apiserver.csr -config openssl.cnf`

openssl.cnf
```cnf
[req]
req_extensions = v3_req
distinguished_name = req_distinguished_name
[ v3_req ]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation
subjectAltName = @alt_names
[alt_names]
DNS.1 = kubernetes
DNS.2 = kubernetes.default
DNS.3 = kubernetes.default.svc
DNS.4 = kubernetes.default.svc.cluster.local
IP.1 = 10.96.0.1
IP.2 = 172.17.0.87
```
 
And then lastly, just like each time before, sign the certificate using the CA certificate end key. 
- `$ openssl x509 -req -in apiserver.csr -CA ca.crt -CAkey ca.key -out apiserver.crt`

You then have the Kube API server certificate.

It's important to consider the Kube API client certificates...
![TLS in K8s](/images/kubernetes/diagrams/6-5-6-tls-in-kubernetes.png)
...which the Kube API server uses when communicating as a client to the ETCD and kubelet servers. This ensures secure communication between the API server and other components of the Kubernetes cluster. Let's examine how these certificates are provided to the Kube API server's executable or service configuration file. 

/etc/kubernetes/manifests/kube-apiserver.yaml
![Pasted image 20240309180617.png](/images/kubernetes/images/Pasted-image-20240309180617.png)
- First, the CA file needs to be passed in which specifies the file containing the certificate authority (CA) certificates for authenticating clients.
```--client-ca-file=/var/lib/kubernetes/ca.pem```
- Then we provide the API server certificates under the TLS cert options. 
```
--tls-cert-file=/var/lib/kubernetes/apiserver.cr
--tls-private-key-file=/var/lib/kubernetes/apiserver.key
```
- We then specify the client certificates used by Kube API server to connect to the ETCD server again with the CA file.
```
--etcd-ca-file=/var/lib/kubernetes/ca.pem
--etcd-certfile=/var/lib/kubernetes/apiserver-etcd-client.crt
--etcd-keyfile=/var/lib/kubernetes/apiserver-etcd-client.key
```
- And finally, the Kube API server client certificates to connect to the kubelets.
```
--kubelet-ca-file=/var/lib/kubernetes/ca.pem
--kubelet-certfile=/var/lib/kubernetes/apiserver-kubelet-client.crt
--kubelet-keyfile=/var/lib/kubernetes/apiserver-kubelet-client.key
```

#### Kubelet Server Certificates
The kubelet server is an HTTPS API server that runs on each node, responsible for managing the node. That's who the API server talks to to monitor the node as well as send information regarding what pods to schedule on this node. 
- Each node in the cluster requires its own key-certificate pair. These certificates are named after their respective nodes, such as node01, node02, and node03. 
1) `$ openssl genrsa -out kubelet-node01.key 2048` 
2) `$ $ openssl req -new -key kubelet-node01.key -subj "/CN=kubelet/O=system:nodes" -out kubelet-node01.csr`
3) `$ openssl x509 -req -in kubelet-node01.csr -CA ca.crt -CAkey ca.key -out kubelet-node01.crt`
4) Repeat this process for node02, node03, etc.

After creating the certificates, incorporate them into the kubelet config file. Ensure to include the root CA certificate and then add the specific kubelet node certificates for each node in the cluster.

kubelet-config.yaml (node01)
```
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
authentication:
  x509:
    clientCAFile: "/var/lib/kubernetes/ca.pem"
authorization:
  mode: Webhook
clusterDomain: "cluser.local"
clusterDNS:
  - "10.32.0.10"
podCIDR: "${POD_CIDR}"
resolvConf: "/run/systemd/resolve/resolve.conf"
runtimeRequestTimeout: "15m"
tlsCertFile: "/var/lib/kubelet/kubelet-node01.crt"
tlsPrivateKeyFile: "/var/lib/kubelet/kubelet-node01.key"
```

We also talked about a set of client certificates that will be used by the kubelet to communicate with the Kube API server. While server-side certificates are used by the KubeAPI server to authenticate clients to it, client   are used by the kubelet to authenticate into the Kube API server and need to be generated as well. 

The API server needs to know which node is authenticating and give it the right set of permissions so it requires the nodes to have the right names in the right formats.
- Since the nodes are system components like the kube-scheduler and the controller-manager we talked about earlier, the format starts with the system keyword, followed by node, and then the node name.
- And how would the API server give it the right set of permissions? Remember we specified a group name for the admin user so the admin user gets administrative privileges? Similarly, the nodes must be added to a group named System Nodes.
1) `$ openssl genrsa -out kubelet-client-node01.key 2048` 
2) `$ openssl req -new -key kubelet-client-node01.key -subj "/CN=system:node:node01/O=system:nodes" -out kubelet-client-node01.csr`
3) `$ openssl x509 -req -in kubelet-client-node01.csr -CA ca.crt -CAkey ca.key -out kubelet-client-node01.crt`

 Once the certificates are generated, they go into the kubeconfig files as we discussed earlier.
 
kubelet-client-config.yaml
```
apiVersion: v1
kind: Config
clusters:
- name: local
  cluster:
    certificate-authority: "/var/lib/kubernetes/ca.pem"
    server: https://${KUBELET_HOSTNAME}:6443
contexts:
- context:
    cluster: local
    user: kubelet-node01
  name: kubelet-node01-context
current-context: kubelet-node01-context
users:
- name: kubelet-node01
  user:
    client-certificate: /var/lib/kubelet/kubelet-client-node01.crt
    client-key: /var/lib/kubelet/kubelet-client-node01.key

```