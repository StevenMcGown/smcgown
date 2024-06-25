---
title: K8s 6.2 - Authentication in K8s
date: 2024-05-20T07:07:07
summary: Exploration & Understanding of Authentication Process in K8s Administration
---
As we have seen already, the Kubernetes cluster consists of multiple nodes, physical or virtual, and various components that work together. There are many types of users that want access to the cluster for various reasons. 
- **Administrators** access the cluster to perform administrative tasks.
- **Developers** access the cluster to test or deploy applications. 
- **End users** access the applications deployed on the cluster.
- **Third party applications** accessing the cluster for integration purposes.

We need to consider two things when securing a Kubernetes cluster:
1) Securing the communication between internal components
2) Securing management access to the cluster through authentication and authorization mechanisms.

In this lecture, our focus is on securing access to the Kubernetes cluster with authentication mechanisms, and in the next we will talk about the latter using TLS encryption.

## Authentication Mechanisms
Above we mentioned different types of users who access the cluster. 
- Security of end users, who access the applications deployed on the cluster is managed by the applications themselves, internally. So we will take them out of our discussion.
- <mark>Our focus is on users' access to the Kubernetes cluster for administrative purposes.</mark>
- We are left with two types of users, people such as the **administrators** and **developers**, and **robots** (third parties) such as other processes or services or applications that require access to the cluster.

<mark>Kubernetes does not manage user accounts natively like AWS IAM , for example.</mark> It relies on an external source like a file with **user details** or **certificates** or a **third party identity service, like LDAP** to manage these users. Therefore, you cannot create users in a Kubernetes cluster or view the list of users like this. 
- However, in case of **service accounts**, Kubernetes can manage them. You can create and manage service accounts using the Kubernetes API. We will discuss SA's later on.

All user access is managed by the KubeAPI Server. Whether you're accessing the cluster through `kubectl` tool or the API directly, all of these requests go through the Kube API server; The Kube API server authenticates the request before processing it.

![Authentication](/images/kubernetes/diagrams/6-2-1-authentication.png)

There are different authentication mechanisms that can be configured. 
- You can have a list of username and passwords in a static password file or usernames and tokens in a static token file.
	- This is a simple solution but it is very insecure. Managing and scaling this way is also cumbersome.
- You can also authenticate using certificates. 
- Another option is to connect to third party authentication protocols like LDAP, Kerberos etc. 

Let's start with static password and token files as it is the easiest to understand. Let's start with the simplest form of authentication. You can create a list of users and their passwords in a CSV file and use that as the source for user information. The file has three columns, password, username, and user ID. 

user-details.csv
```csv
password123, user1, u0001
password123, user2, u0002
password123, user3, u0003
password123, user4, u0004
password123, user5, u0005
```
- We then pass the file name as an option to the Kube API server service. Remember the Kube API server service and the various options we looked at earlier in this course. That is where you must specify this option, like so:

kube-apiserver.service
```
ExecStart=/usr/local/bin/kube-apiserver \\
	--advertise-address=${INTERNAL_IP} \\
	--allow-privleged=true \\
	
	...
	
	--basic-auth-file=user-details.csv
```
 - You must then restart the Kube API server for these options to take effect. 
 - If you set up your cluster using the kubeadm tool, then you must modify the Kube API server POD definition file. The Kubeadm tool will automatically restart the Kube API server once you update this file.

To authenticate using the basic credentials while accessing the API server, specify the user and password in a curl command like this:
`$ curl -v -k https://master-node-ip:6443/api/v1/pods -u "user1:password123`

 In the CSV file with the user details that we saw, we can optionally have a fourth column with the group details to assign users to specific groups.
```csv
password123, user1, u0001, group1
password123, user2, u0002, group2
password123, user3, u0003, group3
password123, user4, u0004, group4
password123, user5, u0005, group5
```

Similarly, instead of a static password file, you can have a static token file. Here instead of password, you specify a token. 

user-token-details.csv
```csv
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9, user11, u0001, group1
JzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik, user12, u0002, group2
G4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQpSf, user13, u0003, group3
wRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw, user14, u0004, group4
```

Pass the token file as an option, tokenauth file to the Kube API server. While authenticating specify the token as an authorization barrier token to your request like this.

kube-apiserver.service
```
ExecStart=/usr/local/bin/kube-apiserver \\
	--advertise-address=${INTERNAL_IP} \\
	--allow-privleged=true \\
	
	...
	
	--token-auth-file=token-details.csv
```

Remember that this authentication mechanism that stores usernames, passwords, and tokens in clear text in a static file, is not a recommended approach as it is insecure. 

---
## Implementing Basic Authentication
NOTICE: Doing this form of authentication is <mark>deprecated</mark> after version 1.19 and is therefore no longer available. 

Edit the kube-apiserver static pod configured by kubeadm to pass in the user details. The file is located at `/etc/kubernetes/manifests/kube-apiserver.yaml`

```
apiVersion: v1
kind: Pod
metadata:
  name: kube-apiserver
  namespace: kube-system
spec:
  containers:
  - command:
    - kube-apiserver
      <content-hidden>
    image: k8s.gcr.io/kube-apiserver-amd64:v1.11.3
    name: kube-apiserver
    volumeMounts:
    - mountPath: /tmp/users
      name: usr-details
      readOnly: true
  volumes:
  - hostPath:
      path: /tmp/users
      type: DirectoryOrCreate
    name: usr-details
```  

Modify the kube-apiserver startup options to include the basic-auth file

```
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  name: kube-apiserver
  namespace: kube-system
spec:
  containers:
  - command:
    - kube-apiserver
    - --authorization-mode=Node,RBAC
    - --basic-auth-file=/tmp/users/user-details.csv
    # Additional configuration for the kube-apiserver container can be added here
```

Create the necessary roles and role bindings for these users:

```
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: user1
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io

```

Once created, you may authenticate into the kube-api server using the users credentials

`curl -v -k https://localhost:6443/api/v1/pods -u "user1:password123"`