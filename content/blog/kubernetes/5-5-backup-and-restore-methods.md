---
title: K8s 5.5 - Backup and Restore Methods
date: 2024-05-18T07:07:07
summary: Detailed Procedures & Techniques for Efficient K8s Backup and Restore Operations
type: "blog"
---
What you should consider backing up in Kubernetes cluster?
- **Definition files** use to create deployments, pods, and services.
- The **ETCD Cluster** is where all cluster-related information is stored, so it is an important thing to consider backing up. 
- If your applications are configured with **persistent storage**, then that is another candidate for backups.

## Backing Up Definition Files with KubeAPI Server
To create cluster resources, at times we use the imperative way of creating an object by executing a command, such as while creating a namespace, or a secret, or config map, or, at times, for exposing applications. 
```
$ kubectl create namespace
$ kubectl create secret
$ kubectl create configmap
```
And at times, we used the declarative approach by first creating a definition file and then running the `$ kubectl apply` command on that file. e.g.

pod-definition.yaml
```
apiVersion: v2
kind: Pod
metadata:
  name: myapp-prod
  labels:
    app: myapp
    type: front-end
spec:
  containers:
  - name: nginx-controller
    image: nginx
```

`$ kubectl apply -f pod-definition.yaml`

- <mark>The declarative approach is the preferred approach if you want to save your configuration</mark>, because now, you have all the objects required for a single application in the form of object definition files in a single folder. 
- This can easily be reused at a later time, or shared with others.

Of course, you must have a copy of these files saved at all times. A good practice is to store these on source code repositories like GitHub, so you don't have to worry about backing up definition files. With that, even when you lose your entire cluster, you can redeploy your application on the cluster by simply applying these configuration files on them.

While the declarative approach is the preferred approach, it is not necessary that all of your team members stick to those standards. What if someone created an object the imperative way without documenting that information anywhere? <mark>In that case, a more thorough approach to backing up resource configuration is to query the Kube API server</mark>. 
- You can query the KubeAPI Server using kubectl, or by accessing the API server directly, and save all resource configurations for all objects created on the cluster as a copy. 
- For example, one of the commands that can be used in a backup script is to get all pods, and deployments, and services in all namespaces using the kubectl utility's get all command, and extract the output in a YAML format, then save that file.
	- `$ kubectl get all --all-namespaces -o yaml > all-deploy-services.yaml`

That's just for a few resource groups; there are many other resource groups that must be considered. For example, here are some resources that might not be covered:
- **Custom Resource Definitions (CRDs)**: Custom resources may not be included.
- **Resource-specific Options**: Some configurations or metadata may be overlooked.
- **Namespace Considerations**: Resources in specific namespaces might be missed.
- **Third-party Resources**: Additional resource types may not be covered.
However, you don't have to develop the solution to back up these yourself. There are tools like Ark, or now called Velero, by Heptio, that can help in taking backups of your Kubernetes cluster using the Kubernetes API.

## Backing Up the ETCD Server
The ETCD cluster stores information about the state of our cluster which includes information about the cluster itself, the nodes and every other resources created within the cluster. <mark>Instead of backing up resource as before, you may choose to backup the ETCD server itself.</mark>

As we have seen before, the ETCD cluster is hosted on the master nodes. While configuring ETCD, we specified a location where all the data would be stored, the **data directory.** The **data directory** is the directory that can be configured to be backed up by your backup tool, as shown in the etcd.service file below. 

etcd.service
```
ExecStart=/usr/local/bin/etcd \\ 
--name ${ETCD_NAME} \\ 
--cert-file=/etc/etcd/kubernetes.pem \\ 
--key-file=/etc/etcd/kubernetes-key.pem \\ 
--peer-cert-file=/etc/etcd/kubernetes.pem \\ 
--peer-key-file=/etc/etcd/kubernetes-key.pem \\ 
--trusted-ca-file=/etc/etcd/ca.pem \\ 
--peer-trusted-ca-file=/etc/etcd/ca.pem \\ 
--peer-client-cert-auth \\ 
--client-cert-auth \\ 
--initial-advertise-peer-urls https://${INTERNAL_IP}: 
--listen-peer-urls https://${INTERNAL_IP}:2380 \\ 
--listen-client-urls https://${INTERNAL_IP}:2379,http 
--advertise-client-urls https://${INTERNAL_IP}:2379 \ 
--initial-cluster-token etcd-cluster-0 \\ 
--initial-cluster controller-0=https://${CONTROLLER0_
--initial-cluster-state new \\
--data-dir=/var/lib/etcd # <--- This is what we are looking at
```

### Snapshot a Cluster
ETCD also comes with a builtin snapshot solution. You can take a snapshot of the etcd database by using the etcdctl utility's snapshot save command. 
```
ETCD_API=3 etcdctl \
    snapshot save snapshot.db
```
- Give the snapshot a name, such as snapshot.db. 
- A snapshot file is created by the name in the current directory. 
- If you want it to be created in another location, specify the full path. 
- You can view the status of the backup using the snapshot status command.
```
ETCD_API=3 etcdctl \
    snapshot status snapshot.db
```

### Restore a Cluster from a Snapshot
To restore the cluster from this backup at a later point in time:
1) Stop the Kube API server service, as the restore process will require you to restart the ETCD cluster, and the Kube API server depends on it. 
```
Service kube-apiserver stop
```
2) In the `$ etcd controls snapshot restore` command, with the path set to the path of the backup file, which is the snapshot.db file. 
```
ETCD_API=3 etcdctl \
    snapshot restore snapshot.db \
    --data-dir /var/lib/etcd-from-backup
```
- When ETCD restores from a backup, in initializes a new cluster configuration and configures the members of ETCD as new members to a new cluster. This is to prevent a new member from accidentally joining an existing cluster.
- Upon running this command, a <mark>new data directory is created.</mark> In this example, at location `/var/lib/etcd-from-backup`. 
- We then configure the ETCD configuration file to use the new data directory. 

etcd.service
```
ExecStart=/usr/local/bin/etcd \\ 
--name ${ETCD_NAME} \\ 
--cert-file=/etc/etcd/kubernetes.pem \\ 
--key-file=/etc/etcd/kubernetes-key.pem \\ 
--peer-cert-file=/etc/etcd/kubernetes.pem \\ 
--peer-key-file=/etc/etcd/kubernetes-key.pem \\ 
--trusted-ca-file=/etc/etcd/ca.pem \\ 
--peer-trusted-ca-file=/etc/etcd/ca.pem \\ 
--peer-client-cert-auth \\ 
--client-cert-auth \\ 
--initial-advertise-peer-urls https://${INTERNAL_IP}: 
--listen-peer-urls https://${INTERNAL_IP}:2380 \\ 
--listen-client-urls https://${INTERNAL_IP}:2379,http 
--advertise-client-urls https://${INTERNAL_IP}:2379 \ 
--initial-cluster-token etcd-cluster-0 \\ 
--initial-cluster controller-0=https://${CONTROLLER0_
--initial-cluster-state new \\
--data-dir=/var/lib/etcd-from-backup # <--- This is what we are looking at
```
- Then, reload the service demon and restart ETCD service. 
```
$ systemctl daemon-reload
$ service etcd restart
```
- Finally, start the Kube API server service. Your cluster should now be back in the original state.
```
service kube-apiserver start
```

## Reminders for Backups
With all the `etcd` commands, remember to specify...
- The **endpoint to the ETCD cluster:** In this case, it's set to `https://127.0.0.1:2379`, indicating that the cluster is running locally on the default port 2379 and accessed over HTTPS.
- The certificate files for authentication:
	- The **CA certificate**: specifies the path to the CA certificate file `/etc/etcd/ca.crt`. This certificate is used to verify the authenticity of the ETCD server's certificate during the TLS handshake.
	- The **ETCD server certificate:** specifies the path to the client certificate file `/etc/etcd/etcd-server.crt`. This certificate is presented by the etcdctl client to the ETCD server for authentication.
	- The **key**: specifies the path to the client private key file `/etc/etcd/etcd-server.key`. This key is used for the client (etcdctl) to prove its identity to the ETCD server during the TLS handshake.
```
ETCD_API=3 etcdctl \
    snapshot save snapshot.db \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/etcd/ca.crt \
    --cert=/etc/etcd/etcd-server.crt \
    --key=/etc/etcd/etcd-server.key
```

We have seen a backup by querying the Kube API server, and also using ETCD, both with their pros and cons. 
- Generally. you're using a managed Kubernetes environment, then, at times, you may not even access to the ETCD cluster. In that case, backup by querying the Kube API server is probably the better way.
