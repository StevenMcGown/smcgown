---
title: K8s 6.7 - Certificates API in K8s
date: 2024-05-25T07:07:07
summary: Understanding and Implementing Certificates API in Kubernetes
type: "blog"
---
In the process of setting up the whole cluster, we have set up a CA server and a bunch of certificates for various components. We then started the services using the right certificates, and it's all up and working. Currently in this setup, whoever created all of these components is the only administrator and user of the cluster and has their own admin certificate and key.

Let's say a new admin comes into my team and needs access to the cluster. To do this, we need to get the new user a certificate and key pair for them to access the cluster.
- First, they create their own private key, generate a certificate signing request (CSR), and sends it to me, the administrator. 
- The admin then takes the CSR to the CA server, gets it signed by the CA server using the CA server's private key and root certificate, thereby generating a certificate and then sends the certificate back to the new user. 
- The new user now has their own valid pair of certificate and key that they can use to access the cluster.

![Certificates API](/images/kubernetes/diagrams/6-7-1-certificates-api.png)

These certificates have a **validity period** which ends after a period of time. Every time it expires, we follow the same process of generating a new CSR and getting it signed by the CA. So we have to keep rotating the certificate files.

What is the CA server and where is it located in the Kubernetes setup? In web browsers, the CA is an external authority like DigiCert, but in the Kubernetes cluster, the Certificate Authority (CA) is an internal component responsible for issuing, signing, and managing certificates for securing communication between various components within the cluster.
- The CA is really just a pair of key and certificate files, we have generated. Whoever gains access to these pair of files, can sign any certificate for the Kubernetes environment, which is why the administrator was able to forward the new user's CSR the CA server.
- The admin can create as many users as they want with whatever privileges they want. So these files need to be protected and stored in a safe environment. 

If you were to place the key and certificate files on a fully secure server, that server becomes your CA server because the certificate key file is safely stored in that server and only on that server. 
- Now every time you want to sign a certificate, you can only do it by logging into that server. 
- As of now we have the certificates placed on the Kubernetes master node itself, so the master node is also our CA server. 
- The kubeadm tool does the same thing; It creates a CA pair of files and stores that on the master node itself.

### Using Certificates API
So far we have been signing requests manually, but as users increase and your team grows, you need a better, automated way to manage the certificates, signing requests, as well as to rotate certificates when they expire. Kubernetes has a built-in certificates API that can do this for you.

With the certificates API, you now send a certificate signing request directly to Kubernetes through an API call. 
- This time, when the administrator receives a certificate signing request, instead of logging onto the master node and signing the certificate by himself, he creates a Kubernetes API object called CertificateSigningRequest. 
- Once the object is created, all certificate signing requests can be seen by administrators of the cluster. The request can be reviewed and approved easily using kubectl commands and the certificate can then be extracted and shared with the user.

Let's see how it is done. 
![Certificates API](/images/kubernetes/diagrams/6-7-2-certificates-api.png)
1) A user first creates a key, then generates a certificate signing request using the key with their name on it, then sends the request to the administrator. 
	`$ openssl genrsa -out sally.key 20948`
2) The administrator takes a key and creates a CertificateSigningRequest object. 
   `$ openssl req -new -key sally.key "/CN=sally" -out sally.csr` 
   The CertificateSigningRequest object is created like any other Kubernetes object, using a manifest file with the usual fields

sally.csr
```
-----BEGIN CERTIFICATE REQUEST-----
MIIC7jCCAdYCAQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9yb... et cetera
-----END CERTIFICATE REQUEST-----

```
   
sally-csr.yaml
```
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
	name: sally
spec:
	expirationSeconds: 600
	usages:
	- digital signature
	- key cipherment
	- server auth
	request:	LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQzdqQ0NBZ... et cetera

```
- The request field is where you specify the certificate signing request sent by the user, but you don't specify it as plain text. Instead, it must be encoded using the `base64` command. Then move the encoded text into the request field and then submit the request.  
3) Once the object is created, all certificate signing requests can be seen by administrators by running the `$ kubectl get csr` command.
	- This command lists all of the certificate signing requests. Identify the new request and approve the request by running the `$ kubectl certificate approve` command. Kubernetes signs the certificate using the CA key pairs and generates a certificate for the user. 
4) This certificate can then be extracted and shared with the user. View the certificate by viewing it in a YAML format. The generated certificate is part of the output, but as before, it is in a base64 encoded format. To decode it, take the text and use the base64 utilities, decode option. This gives the certificate in a plain text format. This can then be shared with the end user.

Now that we have seen how it works, let's see who does all of this for us. If you look at the Kubernetes control plane, you see the Kube-API server, the Scheduler, the Control Manager, etcd server, et cetera. Which of these components is actually responsible for all the certificate related operations? All the certificate related operations are carried out by the Controller Manager. If you look closely at the Controller Manager, you will see that it has controllers in it called as CSR-Approving, CSR-signing, et cetera. They're responsible for carrying out these specific tasks.

We know that if anyone has to sign certificates, they need the CS Server's route certificate and private key. The Controller Manager service configuration has two options where you can specify these.