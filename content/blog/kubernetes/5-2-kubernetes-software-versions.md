---
title: K8s 5.2 - Kubernetes Software Versions
date: 2024-05-15T07:07:07
summary: An in-depth look at the various software versions of Kubernetes
type: "blog"
---
When you run `$ kubectl get nodes` on your k8s cluster, you will get an output similar to below:

```
NAME     STATUS   ROLES   AGE   VERSION
master   Ready    master  1d    v1.11.3
node-1   Ready    <none>  1d    v1.11.3
node-2   Ready    <none>  1d    v1.11.3
```

Take note of the data under the VERSION section. It is subdivided into 3 parts: major.minor.patch.
- So in this case, the major version is 1, minor is 11, and patch is 3.

Just like many other popular applications out there, Kubernetes follows a standard software release versioning procedure. Every few months, it comes out with new features and functionalities through a minor release. The first major version, 1.0, was released in July of 2015. As of Februrary 2024, the latest version of K8s is 1.29

Whatever we have seen here are stable releases of Kubernetes. Apart from these, you will also see alpha and beta releases. All the bug fixes and improvements first go into an alpha release, tagged alpha. In this release, the features are disabled by default, and may be buggy. Then from there, they make their way to beta release, where the code is well tested, the new features are enabled by default. And finally, they make their way to the main stable release.

![Software Versions](/images/kubernetes/diagrams/5-2-1-kubernetes-software-versions.png)

You can find all the releases in the releases page of the Kubernetes GitHub repository.
- Download the Kubernetes.tar.gz file and extract it to find executables for all the Kubernetes components. The downloaded package, when extracted, has all the control plane components in it, all of them of the same version.

Remember that **there are other components within the control plane that do not have the same version numbers.** The ETCD cluster and CoreDNS servers have their own versions, as they are separate projects. The release nodes of each release provides information about the supported versions of externally dependent applications, like etcd and CoreDNS.