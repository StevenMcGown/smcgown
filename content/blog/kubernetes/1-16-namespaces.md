---
title: K8s 1.16  Namespaces
date: 2024-04-20T07:07:07
summary: Comprehensive Guide on Utilizing Namespaces in Kubernetes
type: "blog"
---
Namespaces can be used in K8s to isolate groups of resources in a cluster. Names of resources need to be unique within a namespace, but not across namespaces.

K8s starts with 4 initial namespaces:
  - **default**: K8s includes this namespace so that you can create resources without having to first create a namespace.
  - **kube-node-lease**: This namespace holds Lease objects associated with each node. Node leases allow the Kubelet to send heartbeats so that the control plane can detect node failure.
  - **kube-public**: This namespace is readable by all clients (including those not authenticated). This namespace is mostly reserved for cluster usage, in case that some resources should be visible and readable publicly throughout the whole cluster. The public aspect of this namespace is convention, but not required.
  - **kube-system**: The namespace for objects created by the K8s system.
  
  Not all objects are in a namespace. For example, <mark>nodes and persistent volumes are not in namespaces.</mark>
- Namespaces are often used in conjunction with Role Based Access Control (RBAC) to control access to resources.
- Users or groups can be granted specific permissions within a namespace, allowing for fine-grained access control.
- You can also create policies to set resource limits so that namespaces are guaranteed to have a certain number of resources and can't exceed a limit.
- <mark>When you create a Service, it creates a corresponding DNS entry.</mark> This entry is of the form "service-name.namespace-name.svc.cluster.local"
	- For example: "db-service.dev.svc.cluster.local".
	- If a container refers to a service using only its name (in this case, "db-service"), it will resolve to the service which is local to the namespace as the container. 
		- This is particularly useful when you have the same application configuration deployed in multiple namespaces (e.g., development, quality assurance, and production), and you want each instance to interact with its local services.
		- If you want to reach across namespaces, you need to use the Fully Qualified Domain Name (FQDN). As a result, all namespace names must be valid RFC 1123 DNS labels.

If you do a simple `$ kubectl get pods`, you will only get the pods in the default namespace. 

To list pods in another namespace, use the --namespace flag. e.g. `$ kubectl get pods --namespace=Kube-system`

If you want to make sure that certain resources are always created in a specific namespace, for example, pods in the dev namespace, you can define it in the metadata attribute of the definition file.

If you just want to create a pod in the namespace once, you could also do it with the CLI using a definition file:
`$ kubectl create -f pod-definition.yml`

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: myapp-prod
  namespace: dev # defined here
```

You can also create a pod in a namespace by defining it in the CLI command: `$ kubectl run example-pod --namespace=dev`

Creating a namespace is simple as well using:
`$ kubectl create -f namespace-dev.yaml`

namespace-dev.yaml
```
apiVersion: v1
kind: Namespace
metadata:
  name: dev
```

What if we want to switch to the dev namespace permanently? Use `$ kubectl1 config set-context $(kubectl config current-context) --namespace=dev`
- Now when you run `$ kubectl get pods`, it will return the pods in the dev namespace.

If you want to get the pods from the default namespace, you will have to include the command and specify the `--namespace` as "default".

If you want to view pods in all namespaces, use `$kubectl get pods --all-namespaces`

To create a resource quota, run:
`$ kubectl create -f compute-quota.yml`

compute-quota.yml:
```
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: dev
spec:
  hard:
    pods: "10"
    requests.cpu: "4"
    requests.memory: 5Gi
    limits.cpu: "10"
    limits.memory: 10Gi
```