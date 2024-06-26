---
title: K8s 6.17 - Network Policies
date: 2024-06-04T07:07:07
summary: Discussion and implementation of Network Policies in K8s
type: "blog"
---
Let's say that you have a web server serving front end to users, an app server serving backend APIs, and a database server. 
1) The user sends in a request to the web server at port 80. 
2) The web server then sends a request to the API server at port 5000 in the backend. 
3) The API server then fetches data from the database server at port 3306
4) The API server then sends the data back to the user.

![Network Policies](/images/kubernetes/diagrams/6-17-1-network-policies.png)

There are two types of traffic here: **ingress** and **egress**. 
- For example, for the web server, the incoming traffic from the users is ingress traffic and the outgoing request to the app server is egress traffic, denoted by the straight arrow. 
- Similarly, in the case of the backend API server, it receives ingress traffic from the web server on port 5000 and has egress traffic to port 3306 to the database server. 
- From the database server's perspective, it receives ingress traffic on port 3306 from the API server.

Think of it this way: When you define ingress and egress, you're only looking at **the direction in which the traffic originated.** The path in which the response makes it's way back to the user, denoted by the dotted lines, does not really matter.
  
### Traffic Rules

If we were to list the rules required to get this working, we would have an ingress rule that is required to accept HTTP traffic on port 80 on the web server, an egress rule to allow traffic from the web server to port 5000 on the API server, an ingress rule to accept traffic on port 5000 on the API server, and an egress rule to allow traffic to port 3306 on the database server. And finally, an ingress rule on the database server to accept traffic on port 3306.

![Network Policies](/images/kubernetes/diagrams/6-17-2-network-policies.png)
### Network Security in Kubernetes

Let us now look at network security in Kubernetes. Take a cluster with a set of nodes hosting a set of pods and services. Each node has an IP address, and so does each pod and service. One of the prerequisites for networking in Kubernetes is whatever solution you implement, the pods should be able to communicate with each other without having to configure any additional settings like routes.

![Network Policies](/images/kubernetes/diagrams/6-17-3-network-policies.png)

For example, in this network solution, all pods are on a virtual private network that spans across the node in the Kubernetes cluster and they can all by default reach each other using the IPs or pod names or services configured for that purpose. Kubernetes is configured by default with an **"All Allow"** rule that allows traffic from any pod to any other pod or services within the cluster.

### Applying Network Policies

Let us now bring back our earlier discussion and see how it fits into Kubernetes. For each component in the application, we deploy a pod. One for the front end web server, one for the API server, and one for the database. We create services to enable communication between them as well as to the end user. Based on what we discussed earlier, by default, all three pods can communicate with each other within the Kubernetes cluster.

![Network Policies](/images/kubernetes/diagrams/6-17-4-network-policies.png)

What if we do not want the front end web server to be able to communicate with the database server directly? Say, for example, your security teams and audits require you to prevent that from happening. That is where you would implement a network policy to allow traffic to the DB server only from the API server. A network policy is another object in the Kubernetes namespace just like pods, replica sets, or services. You link a network policy to one or more pods and can define rules within the network policy.

![Network Policies](/images/kubernetes/diagrams/6-17-5-network-policies.png)

In this case, I would say only allow ingress traffic from the API pod on port 3306. Once this policy is created, it blocks all other traffic to the pod and only allows traffic that matches the specified rule. Again, this is only applicable to the pod on which the network policy is applied.

### Applying Network Policies to Pods

So how do you apply or link a network policy to a pod? We use the same technique that was used before to link replica sets or services to pods: **labels and selectors.** 

Let's take two pods for example, one for running a database and the other for running an API server. Here we can see that the labels are `role: db` and `role: api`



pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: db
  namespace: prod
  labels:
    role: db
spec:
  containers:
  - name: db-container
    image: mysql:5.7
    ports:
    - containerPort: 3306
      name: mysql

---

apiVersion: v1
kind: Pod
metadata:
  name: api
  namespace: prod
  labels:
    name: api-pod
spec:
  containers:
  - name: api-container
    image: your-api-image
    ports:
    - containerPort: 8080
      name: api-port
```

We use the same labels on the port selector field in a network policy and then we build our rule. Under policy types, specify whether the rule is to allow ingress or egress traffic or both. In our case, we only want to allow ingress traffic to the DB pod, so we add ingress.

Next, we specify the ingress rule that allows traffic from the API pod and you specify the API pod again using labels and selectors. And finally, the port to allow traffic on, which is 3306.

network-policy.yaml
```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-db
  namespace: prod
spec:
  podSelector:
    matchLabels:
      role: db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          name: api-pod
    ports:
    - protocol: TCP
      port: 3306
```

That's it. We have our first network policy ready.

Note that ingress or egress isolation only comes into effect if you have ingress or egress in the policy types. 
- In this example, there is only **ingress** in the policy type which means <mark>only ingress traffic is isolated and all egress traffic is unaffected</mark>, meaning the pod is able to make any egress calls and they are not blocked. 
- So for egress or ingress isolation to take place, note that you have to add them under the policy types as seen here. Otherwise, there is no isolation.

Run `$ kubectl create -f network-policy.yaml` to create the policy.

One thing to consider is that network policies are enforced by the network solution implemented on the Kubernetes cluster and <mark>not all network solutions support network policies.</mark> 
Supported:
- Kube-router
- Calico
- Romana
- Weave Net 

Always refer to the network solution's documentation to see support for network policies. In a solution that does not support network policies you can still create the policies, but they will just not be enforced. You will not get an error message saying the network solution does not support network policies.