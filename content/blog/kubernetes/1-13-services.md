---
title: K8s 1.13 - Services in Kubernetes
date: 2024-04-17T07:07:07
summary: Detailed exploration of services and service-related functionalities in Kubernetes.
---
**Services** in Kubernetes enable communication between various components within and outside of the application. They help connect applications together with other applications or users.
![Services](/images/kubernetes/diagrams/1-13-1-services.png)

Thus, services enable loose coupling between microservices in an application. They allow communication without directly accessing individual Pods. For example, if you want to access the IP address of pods running inside a node from a workstation outside of the cluster, you would need a Service to achieve this without accessing the node first.

The below example illustrates a NodePort service.
![Services Example](/images/kubernetes/diagrams/1-13-3-services.png)

There are various types of services:
  - **NodePort**: Used to expose services on a static port for external access.
  - **ClusterIP**: Creates a virtual IP inside the cluster to enable communication between different services within the cluster.
  - **LoadBalancer**: Provisions a load balancer for an application in supported cloud providers, distributing load across web servers in the frontend tier.
- **NodePort** and **ClusterIP** services are accessible within the cluster, while LoadBalancer services are exposed externally using a cloud provider's load balancer for external access and traffic distribution.

Taking a closer look at the service from the previous example, there are 3 ports involved:
![Services Nodeport](/images/kubernetes/diagrams/1-13-6-services.png)

  1) The **TargetPort** is the port where the service is forwarding requests to (8005)
  2) The **Port** is the port on the service itself. The service is like a virtual endpoint inside of the node. Inside of the pod, it has its own IP address called the ClusterIP.
  3) The **NodePort** is the port on the node that is used to access the web server externally. Node ports can only be in the range <mark>30,000 to 32,767.</mark>

You can define it in a file like this:

service-definition.yaml
```
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: NodePort
  ports: # ports is an array
  - targetPort: 80
    port: 80
    nodePort: 30008
  selector:
    app: myapp
    type: front-end
```

Some things to note:
- **port** is the only required attribute
	- If you don't provide **targetPort**, the number provided by port is assumed.
	- If you don't provide **nodePort**, a free port in the range 30,000 - 32,767 us automatically allocated.
- The ports attribute is an array, so you can have multiple port mappings within a single service.
- To link a pod with the service, you need to use the **selector** attribute and take the labels from the pod definition.

Create the service using:
`$ kubectl create -f service-definition.yml`

List it using:
`$ kubectl get services`

Finally, you can curl using:
`$ curl http://192.168.1.2:30008`

What do you do when you have multiple pods for high availability and you want to be able to curl the pods? In this example, the pods all have the same labels.

![Services High Availability](/images/kubernetes/diagrams/1-13-4-services.png)

In this case, let's assume that all 3 pods are labeled the same. The service would select all 3 pods as endpoints to forward the external request coming from the user. You don't have to do any additional configuration to make this happen. The algorithm that it uses is just a random algorithm. Thus, the service acts as a built-in load balancer to distribute load across different pods.

*What about for pods that span across nodes?*

![Services Span Nodes](/images/kubernetes/diagrams/1-13-7-services.png)

When you create a service, without having to do any additional configuration, K8s automatically creates a service that spans across all nodes on the cluster and maps the target port to the same node port on all nodes in the cluster. This way you can access the application using the IP of any node in the cluster with the same port number.