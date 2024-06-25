---
title: K8s 6.16 - Security Contexts in K8s
date: 2024-06-03T07:07:07
summary: Detailed discussion & overview of security contexts in Kubernetes.
---
As we saw in the previous post, when you run a Docker container, you have the option to define a set of security standards, such as the ID of the user used to run the container, the Linux capabilities that can be added or removed from the container, et cetera. 

If you wish to override this behavior and provide additional privileges than what is available, use the `--cap-add` option in the Docker run command.
`$ docker run --cap-add MAC_ADMIN ubuntu`
`$ docker run  --cap-drop KILL ubuntu`
`$ docker run --priviliged ubuntu`

These can be configured in Kubernetes as well. As you know already, in Kubernetes, containers are encapsulated in Pods. You may choose to configure the security settings at a container level or at a Pod level. 

![Security Contexts](/images/kubernetes/diagrams/6-16-1-security-contexts.png)

If you configure it at a Pod level, the settings will carry over to all the containers within the Pod. If you configure it at both the Pod and the container, the settings on the container will override the settings on the Pod.

### Configuring Security Context

Let us start with a Pod definition file. 

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  containers:
    - name: ubuntu
      image: ubuntu
      command: ["sleep", "3600"]
```
This pod runs an Ubuntu image with the sleep command. To configure security context on the container, add a field called security context under the spec section of the Pod. Use the runAsUser option to set the user ID for the Pod. 

```
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  securityContext:
    runAsUser: 1000
  containers:
    - name: ubuntu
      image: ubuntu
      command: ["sleep", "3600"]
```

To set the same configuration on the container level, move the whole section under the container specification like this.

```
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  containers:
    - name: ubuntu
      image: ubuntu
      command: ["sleep", "3600"]
      securityContext:
        runAsUser: 1000
```

To add **capabilities**, use the capabilities option, and specify a list of capabilities to add to the Pod. 

```
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  containers:
    - name: ubuntu
      image: ubuntu
      command: ["sleep", "3600"]
      securityContext:
        runAsUser: 1000
        capabilities:
          add: ["MAC_ADMIN"]
```

Note: Capabilities are only supported at the container level and **not** at the pod level.