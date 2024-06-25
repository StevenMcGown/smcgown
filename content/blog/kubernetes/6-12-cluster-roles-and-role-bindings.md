---
title: K8s 6.12 - Cluster Roles & Role Bindings
date: 2024-05-30T07:07:07
summary: Deep Dive into Cluster Roles & Role Bindings in K8s
---
We discussed roles and role bindings in the previous lecture. In this lecture, we will talk about *cluster* roles and *cluster* role bindings. 

When we talked about roles and role bindings, we said that roles and role bindings are namespaced, meaning they are created within namespaces. If you don't specify a namespace, they are created in the default namespace and control access within that namespace alone. 

We previously discussed how namespaces help in grouping or isolating resources such as pods, deployments, and services. But what about resources like nodes? Can you group or isolate nodes within a namespace, such as assigning node 01 to the dev namespace? No. Nodes are cluster-wide or cluster-scoped resources and cannot be associated with any particular namespace. Therefore, resources are categorized as <mark>either namespaced or cluster-scoped.</mark>

### Namespaced Resources
Now we have seen a lot of namespaced resources throughout this course, like pods, and replica sets, and jobs, deployments, services, secrets. In the last section, we introduced two new ones: roles and role bindings. These, like other namespaced resources, are created in the specified namespace. If no namespace is specified, they are created in the default namespace. To view, delete, or update them, you must always specify the correct namespace.

### Cluster-Scoped Resources
Cluster-scoped resources are those where you don't specify a namespace when creating them, such as nodes and persistent volumes. This contrasts with the cluster roles and cluster role bindings that we'll discuss in this post. 

Other examples of non-namespaced resources include certificate signing requests and namespace objects themselves. This is not a comprehensive list of resources. To see a full list of namespaced and non-namespaced resources, run the `$ kubectl api-resources` command with the namespaced option set.

### Authorizing Cluster-Wide Resources
In the previous section, we saw how to authorize a user to namespace resources. We used roles and role bindings for that. But how do we authorize users to cluster-wide resources like nodes or persistent volumes? That is where you use cluster roles and cluster role bindings. 

Cluster roles are just like roles, except they are for cluster-scoped resources. For example, a cluster admin role can be created to provide a cluster administrator permissions to view, create, or delete nodes in a cluster. Similarly, a storage administrator role can be created to authorize a storage admin to create persistent volumes and claims.

cluster-admin-role.yaml
```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-administrator
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["list", "get", "create", "delete"]
```

Create a cluster role definition file with the kind cluster role and specify the rules as we did before. In this case, the resources are nodes, then create the cluster role. 

`$ kubectl create -f cluster-admin-role.yaml`

The next step is to link the user to that cluster role. For this, we create another object called cluster role binding. The role binding object links the user to the role. 

cluster-admin-role-binding.yaml
```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-admin-role-binding
subjects:
- kind: User
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-administrator
  apiGroup: rbac.authorization.k8s.io
  
```
We will name it cluster-admin-role-binding. The kind is ClusterRole binding. Under subjects, we specify the user details, cluster admin user in this case. The role ref section is where we provide the details of the cluster role we created. Create the role binding using:
`$ kubectl create -f cluster-admin-role-binding.yaml`

### Cluster Roles for Namespaced Resources
  
We mentioned that cluster roles and bindings are typically used for cluster-scoped resources, but this is not a strict rule. You can create a cluster role for namespaced resources as well. When you do this, the user will have access to these resources across all namespaces. Previously, when we created a role to authorize a user to access pods, the user only had access to pods in a specific namespace. With cluster roles, however, a user authorized to access pods will have access to all pods across the cluster. Kubernetes creates several cluster roles by default when the cluster is first set up. We will explore these later.