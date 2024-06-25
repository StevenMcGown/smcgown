---
title: K8s 6.11  Kubernetes RBAC
date: 2024-05-29T07:07:07
summary: Overview and Detailed Explanation of Role-Based Access Control in Kubernetes
---
In this section, we delve deeper into role-based access controls. To create a role, we start by crafting a role object. This begins with a role definition file:

```
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: 
  name: developer
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["list", "get", "create", "update", "delete"]
- apiGroups: [""]
  resources: ["ConfigMap"]
  verbs: ["create"]
```
As usual, we define the following:
- **API Version**: `rbac.authorization.k8s.io/v1`
- **Kind**: `Role`
- **Name**: We will name the role `developer`, as it is intended for developers.

Each rule within a role consists of three sections:
- **API Groups**: For the Core group, leave this blank. For others, specify the group name.
- **Resources**: For example, `pods`.
- **Verbs**: Such as `list`, `get`, `create`, and `delete`.

To enable developers to create config maps, we add another rule for the `configmap` resource.

Multiple rules can be added to a single role to grant various permissions. Use the command `$ kubectl create -f developer-role.yaml` to create the role.

## Linking Users to Roles

The next step involves creating a `RoleBinding` to link a user to the newly created role. 

devuser-developer-binding.yaml
```
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: devuser-developer-binding
subjects:
- kind: User
  name: dev-user
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```
We'll name this binding **devuser-developer-binding** with the kind set to `RoleBinding`, which includes:
- **Subjects**: Here, we specify user details.
- **RoleRef**: This section provides details of the role we created.

Create the role binding using the `$ kubectl create -f devuser-developer-binding.yaml` command.

Also, consider that Roles and role bindings are scoped to namespaces. Thus, **dev-user** gets access to pods and config maps within the default namespace. If access should be limited to a different namespace, specify the namespace in the metadata of the definition file.

## Managing Roles and Role Bindings

- To view Roles, run `$ kubectl get roles`.
- To ilst Role Bindings, run `$ kubectl get rolebindings`.
- For detailed information, use `$ kubectl describe role developer` and `$ kubectl describe rolebinding devuser-developer-binding`.

## Verifying Permissions
What if you want to check if you, a user, has access to a particular resource in the cluster?

To check if a user has access to a specific resource, e.g. creating deployments `kubectl auth can-i create deployments`
- This command will simply output 'yes' or 'no' depending on whether or not you have access to specific resources.

Administrators can impersonate users to check permissions with the `--as` option.
- For instance, testing whether the developer role permits creating deployments might return `no`, but it does allow creating pods.
- e.g. `$ kubectl auth can-i create deployments --as dev-user`

### Namespace-Specific Permissions

You can also specify namespaces in your queries to test access to resources in different namespaces. For example, checking if **dev-user** can create a pod in the **test** namespace:
`$ kubectl can-i create pods --as dev-user --namespace test`

### Resource Specific Permissions
It's possible to restrict access to **specific resources** within a namespace. For example, you can allow a user access only to `blue` and `orange` pods by adding a `resourceNames` field to the rule.

```
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: 
  name: developer
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["list", "get", "create", "update", "delete"]
  resourceNames: ["blue","orange"]
```