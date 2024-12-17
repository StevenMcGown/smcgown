---
title: K8s 6.9 - API Groups
date: 2024-05-27T07:07:07
summary: An in-depth overview of API groups within the Kubernetes system
type: "blog"
---
Whatever operations we have done so far with the cluster, we've been interacting with the API server one way or the other, either through the Kube control utility or directly via REST.

Let's say we want to check the version of the Kube API Server. We can access the API server at the master node's address followed by the port, which is 6443, by default, and the API version. 

`$ curl https://kube-test-server:6443/version`

To get a list of pods, you would access the URL `api/v1/pods`. Our focus in this post is about these API pods, the version, and the API.

`$ curl https://kube-test-server:6443/api/v1/pods`

## API Groups

The Kubernetes API is organized into various groups, each serving a specific function, such as groups for APIs, health, metrics, and logs. 
- The version endpoint, as shown above, allows you to view the version details of the cluster. 
- The Metrics and Health endpoints are crucial for monitoring the cluster's health and performance,
- The logs endpoint facilitates integration with third-party logging applications, enabling detailed tracking and analysis of the cluster's operations. 

Additionally, there are several other specialized endpoints. This structured approach ensures comprehensive management and monitoring capabilities across different aspects of the Kubernetes environment.

## Cluster Functionality APIs

In this section, we will focus on the APIs **responsible for the cluster functionality.** These APIs are categorized into two; the <mark>core group </mark>and the <mark>named group.</mark> 

The **core group** is where all core functionality exists, such as namespaces, pods, replication controllers, events and endpoints, nodes, bindings, persistent volumes, persistent volume claims, config maps, secrets, services, et cetera.

![API groups](/images/kubernetes/diagrams/6-9-1-api-groups.png)

The **named group** APIs are more organized and going forward, all the newer features are going to be made available through these named groups. It has groups under it for apps, extensions, networking, storage, authentication, authorization, et cetera. Shown here are just a few. 
- Within apps, you have deployments, replica sets, stateful sets.
- Within networking, you have network policies. 
- Certificates have these certificate signing requests that we talked about earlier in the section.

![API groups](/images/kubernetes/diagrams/6-9-2-api-groups.png)

So the ones at the top are API groups, and the ones at the bottom are resources in those groups. Each resource in this has a set of actions associated with them; Things that you can do with these resources, such as list the deployments, get information about one of these deployments, create a deployment, delete a deployment, update a deployment, watch a deployment, et cetera. These are known as **verbs.**

## API Group Reference

The [Kubernetes API reference page](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/#pod-v1-core) can tell you what the API group is for each object; select an object, and the first section in the documentation page shows its group details, v1 core is just v1.
![Pasted image 20240515132803.png](/images/kubernetes/images/Pasted-image-20240515132803.png)
You can also view these on your Kubernetes cluster. If you access your Kube API server at port 6443 without any path and it will list you the available API groups. 
`$ curl http://localhost:6443 -k`

And then, within the named API groups, it returns all the supported resource groups.
`$ curl http://localhost:6443/apis -k`
## Accessing the Cluster API

A quick note on accessing the cluster API like that. If you were to access the API directly through cURL as shown above, you will not be allowed access except for certain APIs like version, as you have not specified any authentication mechanisms. So you have to authenticate to the API using your certificate files by passing them in the command line like this.
```
$ curl http://localhost:6443 -k
	--key admin.key
	--cert admin.crt
	--cacert ca.crt
```

## Kube Control Proxy

An alternate option is to start a Kube control proxy client. The Kube control proxy command launches a proxy service locally on port 8001 and uses credentials and certificates from your Kube config file to access the cluster. That way, you don't have to specify those in the cURL command. 
`$ kubectl proxy`
![API groups](/images/kubernetes/diagrams/6-9-3-api-groups.png)

Now you can access the Kube control proxy service at port 8001, and the proxy will use the credentials from Kube config file to forward your request to the Kube API server. This will list all available APIs at root.
`$ curl http://localhost:8001 -k`
## Kube Proxy vs. Kube Control Proxy

So here are two terms that kind of sound the same; The Kube Proxy and Kube control proxy. They are in fact not the same. We discussed about Kube proxy earlier this course - it's used to enable connectivity between pods and services across different nodes in the cluster, whereas Kube control proxy is an <mark>HTTP proxy service created by Kube control utility to access the Kube API server.</mark>

## Conclusion on API Groups

What should you remember from this overview? All resources in Kubernetes are categorized into different API groups. At the highest level, there is the **core** API group and various **named** API groups. Each named API group covers a specific area, and under these groups, different resources are organized. Each resource supports a set of actions, **known as verbs**, which define interactions with the resources. 

In the upcoming section on authorization, we'll explore how these verbs are used to grant or deny access to users.