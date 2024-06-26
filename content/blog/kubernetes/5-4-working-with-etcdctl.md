---
title: K8s 5.4 - Working with etcdctl
date: 2024-05-17T07:07:07
summary: Detailed guide on working with etcdctl in Kubernetes
type: "blog"
---
`etcdctl` is a command line client for [**etcd**](https://github.com/coreos/etcd).

In all our Kubernetes Hands-on labs, the ETCD key-value database is deployed as a static pod on the master. The version used is v3.

To make use of etcdctl for tasks such as back up and restore, make sure that you set the ETCDCTL_API to 3.

You can do this by exporting the variable ETCDCTL_API prior to using the etcdctl client. This can be done as follows:

`export ETCDCTL_API=3`

On the **Master Node**:
![](https://process.fs.teachablecdn.com/ADNupMnWyR7kCWRvm76Laz/resize=width:1000/https://www.filepicker.io/api/file/T7Y4a6aUTyOy9W2ZpfeV)

To see all the options for a specific sub-command, make use of the **-h or --help** flag.
- For example, if you want to take a snapshot of etcd, use: `etcdctl snapshot save -h` and keep a note of the mandatory global options.

Since our ETCD database is TLS-Enabled, the following options are mandatory:
- `--cacert`: verify certificates of TLS-enabled secure servers using this CA bundle
- `--cert`: identify secure client using this TLS certificate file
- `--endpoints=[127.0.0.1:2379]`: This is the default as ETCD is running on master node and exposed on localhost 2379.
- `--key`: identify secure client using this TLS key file

Similarly, use the help option for **snapshot restore** to see all available options for restoring the backup.
`etcdctl snapshot restore -h`