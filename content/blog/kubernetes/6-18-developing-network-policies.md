---
title: K8s 6.18 - Developing Network Policies
date: 2024-06-05T07:07:07
summary: Detailed exploration of developing and implementing Kubernetes network policies
type: "blog"
---
Here we have the same web API and database pods from the previous post. 

![Network Policies](/images/kubernetes/diagrams/6-17-4-network-policies.png)

Let's clarify our requirements. Our goal is to protect the database pod, allowing access only from the API pod and only on port 3306. 
- We are not concerned about the web pod or the API pod, so we are okay with all traffic to and from those pods. 
- However, we need to focus on securing the database pod to only allow traffic from the API pod. 
- We can ignore the web pod and its port since we are focused on not allowing any other sources to access the database pod. 
- Similarly, we can disregard the port on the API pod that the web server connects to, as it is not relevant to our goal.

### Default Kubernetes Behavior

As we discussed, by default, Kubernetes allows all traffic from all pods to all destinations. So as the first step, we want to block out everything going in and out of the database pod. So we create a network policy, we will call it db-policy, and the first step is to associate this network policy with the pod that we want to protect.

We do that using labels and selectors. So we do that by adding a podSelector field with the matchLabels option and by specifying the label on the DB pod, which happens to be set to `role: db`. 

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
```

This associates the network policy with the database pod and blocks out all traffic.

![Network Policies](/images/kubernetes/diagrams/6-18-1-developing-network-policies.png)

### Allowing Traffic from the API Pod

However, we need the API pod to be able to query the database on port 3306. So that's what we are going to configure next. First, we need to figure out what type of policies should be defined on this network policy object to meet our requirements. There are two types of policies that we discussed in the previous post: ingress and egress. 

Do we need ingress or egress here, or both? 

You should always look at this from the DB pod's perspective. From the DB pod's perspective, we want to allow incoming traffic from the API pod, so that is ingress. The API pod makes database queries and the database pods return the results. 

What about the results? Do you need a separate rule for the results to go back to the API pod? No, because once you allow incoming traffic, <mark>the response or reply to that traffic is allowed back automatically</mark> and we don't need a separate rule for that. 
- In this case, all we need is an ingress rule to allow traffic from the API pod to the database pod, and that would allow the API pod to connect to the database, run queries, and also retrieve the result of the queries.

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
```

### Direction of Traffic

When deciding what type of rule to create, focus only on the direction from which the request originates; you don't need to worry about the response. Once you allow incoming traffic, the response or reply to that traffic is automatically allowed back, so a separate rule for responses is unnecessary. However, note that <mark>this rule does not permit the database pod to initiate connections or make calls to the API pod.</mark>

For example, if the database pod attempts to make an API call to the API pod, it will not be allowed because that constitutes egress traffic originating from the database pod. To permit this, a specific egress rule would need to be defined so that the database pod can initiate outbound connections to the API pod.
### Types of Rules

Now that we have decided on the type of policy, the next step is to define the specifics of that policy. A single network policy can have an ingress type of rule, an egress type of rule, or both in cases where a pod wants to allow incoming connections as well as make external calls. For now, our use case only requires ingress policy types. 

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

We create a section called ingress within which we can specify multiple rules. Each rule has a from and ports fields. 
- The from field defines the source of traffic that is allowed to pass through to the database pod. Here we would use a podSelector and provide the labels of the API pod like this. 
- The ports field defines what port on the database pod the traffic is allowed to go to. In this case, it's 3306 with the TCP protocol.

![Network Policies](/images/kubernetes/diagrams/6-18-2-developing-network-policies.png)

That's it, this would create a policy that would block all traffic to the db-pod except for traffic from the API pod. 

### Using Namespace Selectors

Now, what if there are multiple API pods in the cluster with the same labels but in different namespaces? Say, here we have different namespaces for dev, test, and prod environments, and we have the API pod with the same labels in each of these environments.

![Network Policies](/images/kubernetes/diagrams/6-18-3-developing-network-policies.png)

The current policy would allow any pod in any namespace with matching labels to reach the database pod. We only want to allow the API pod in the prod namespace to reach the database pod. 

How do we do that? For this, we add a new selector called the `namespaceSelector` property along with the podSelector property. Under this, we use `matchLabels` again to provide a label set on the namespace. 

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
      namespaceSelector:
        matchLabels:
          name: prod
    ports:
    - protocol: TCP
      port: 3306
```

You must remember that you must have this label set on the namespace first for this to work. The `namespaceSelector` helps in defining from what namespace traffic is allowed to reach the database pod. For example, this pod is being deployed in the "dev" namespace and would not be permitted access given the namespace constraints given above.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: api
  namespace: dev
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

What if you only have the namespaceSelector and not the podSelector like this? In this case, all pods within the specified namespace will be allowed to reach the database pod, such as the web pod that we had earlier, but pods from outside this namespace won’t be allowed to go through.

![Network Policies](/images/kubernetes/diagrams/6-18-4-developing-network-policies.png)

Since we don't want traffic coming from the Web Pod into the DB pod, we should be sure to add the `podSelector` attribute to restrict access.

### IP Block Selector

Let's look at another use case. Say we have a backup server somewhere outside of the Kubernetes cluster and we want to allow this server to connect to the database pod. Since this backup server is not deployed in our Kubernetes cluster, the `podSelector` and `namespaceSelector` fields that we use to define traffic from won’t work because it's not a pod in the cluster. 

![Network Policies](/images/kubernetes/diagrams/6-18-5-developing-network-policies.png)

However, we know the IP address of the backup server, and that happens to be 192.168.5.10. We could configure a network policy to allow traffic originating from certain IP addresses. For this, we add a new type of from definition known as the `ipBlock` definition. IP block allows you to specify a range of IP addresses from which you could allow traffic to hit the database pod.

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
      namespaceSelector:
        matchLabels:
          name: prod
    - ipBlock:
        cidr: 192.168.5.10/32
    ports:
    - protocol: TCP
      port: 3306
```

In this case, we only want to allow a single server to communicate to that pod, so we allow the server's IP address with a subnet mask of /32.
### Supported Selectors

Those are three supported selectors under the from section in ingress, and these are also applicable to the to section in egress, which we’ll see shortly. 
1) We have `podSelector` to select pods by labels. 
2) We have `namespaceSelector` to select namespaces by labels
3) The ipBlock selects IP address ranges. 

These can be passed in separately as individual rules or together as part of a single rule.

### Multiple Rules

In this example, under the "from" section, we have two elements for ingress.
- The first rule has the `podSelector` and the `namespaceSelector` together. 
- The second rule has the `ipBlock` selector. This works like an **OR** operation. Traffic from sources meeting either of these criteria is allowed to pass through.

However, within the first rule, we have two selectors as part of it. That means traffic from sources must meet **both** of these criteria to pass through.
- They have to be originating from pods with **matching labels** of API pod, *and* those pods must be in the **prod namespace**. So it works like an **AND** operation.

### Impact of Configuration

Now what if we were to separate them by adding a dash "-" before the `namespaceSelector`? <mark>Now, they are two separate rules.</mark> 
- This would mean that traffic matching the first rule is allowed; any pod matching the label API pod in the same namespace. 
- Traffic matching the second rule is allowed, which is from any pod within the prod namespace. <mark>Simply adding the dash "-" has caused the rule to behave like an OR operation, thus letting traffic from the Web Pod in as well</mark>
- There is of course the ipBlock specification as well. 

![Network Policies](/images/kubernetes/diagrams/6-18-6-developing-network-policies.png)

So by adding the dash "-", we now have three separate rules, and almost traffic from anywhere in the prod namespace is allowed to the db-pod. A small change like that can have a big impact! It's important to understand how you could put together these rules based on your requirements.

### Defining Egress Rules

Now let's get rid of all of that and go back to a basic set of rules. We'll now look at egress. Say, for example, instead of the backup server initiating a backup, we have an agent on the db-pod that pushes backup to the backup server. 

![Network Policies](/images/kubernetes/diagrams/6-18-7-developing-network-policies.png)

In that case, the traffic is originating from the database pod to an external backup server. For this, we need to have an egress rule defined.

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
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          name: api-pod
    ports:
    - protocol: TCP
      port: 3306
  egress:
  - to:
    - ipBlock:
        cidr: 192.168.5.10/32
    ports: 80
    
```

- First, we add egress to the policy types, and then we add a new egress section to define the specifics of the policy. 
- Instead of "from", we now have "to" under egress. 
- Under "to", we could use any of the selectors such as a pod, a namespace, or an `ipBlock` selector. In this case, since the database server is external, we use `ipBlock` selector and provide the CIDR block for the server. 
- The port to which the requests are to be sent is 80, so we specify 80 as the port. 

In summary, this rule allows traffic originating from the database pod to an external backup server at the specified address.