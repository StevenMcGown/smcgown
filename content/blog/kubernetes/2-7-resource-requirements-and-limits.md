---
title: K8s 2.7 - Resource Requirements & Limits
date: 2024-04-30T07:07:07
summary: Understanding and Managing Resource Requirements & Limits in Kubernetes
---
The K8s scheduler determines which node a pod goes to.
- The scheduler takes into consideration the *amount of resources* required by a pod and those available on the nodes, then identifies the best node to place it on.
- If there is insufficient resources on a node, the scheduler avoids placing a pod on that node. If there are no resources on any of the nodes, the pod will be in a pending state.
- Pod events will tell you that it failed scheduling, e.g. Insufficient cpu.

You can specify the cpu to memory required for a pod when creating one. This is known as the Resource Request for a container. When the scheduler tries to place the pod on a node, it uses these numbers to identify a node with sufficient resources.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: pod-name
spec:
  containers:
  - name: container-name
    image: nginx
    ports:
    - containerPort: 8080
    resources:
      requests:
        memory: "4Gi"
        cpu: "2"
      limits:
        memory: "8Gi"
        cpu: "4"
```

What exactly is "1 CPU"? 1 count of CPU is equal to one vCPU in AWS. You can specify the CPU value as low as 0.1 cpu, which can also be expressed as 100m (milli). You can specify ay value as low as 1m (milli), but no lower than that.

Similarly, with memory:
  - 1 G (Gigabyte) = 1,000,000,000 bytes
  - 1 Gi (Gigabyte) = 1,073,741,824 bytes
  - 1M (Megabyte) = 1,000,000 bytes
  - 1 Mi (Megabyte) = 1,048,576 bytes
  - 1 K (Kilobyte) = 1,000 bytes
  - 1 Ki (Kilobyte) = 1,024 bytes

By default, a container has no limit to the resources it can consume on a node. It can go up and consume as much resources as it requires, <mark>and that suffocates the native processes on the node.</mark>
- You can set **limits** for resource usage to fit that for both CPU and memory.

When you create a pod, Kubernetes sets new **limits** for the container if they have been specified in the pod definition file. When a pod tries to exceed the resource limits, the system prevents the pod from going beyond the limit.
- **CPU**: The system throttles CPU usage.
- **Memory**: If a pod tries to consume more memory than its limit constantly, it will <mark>terminate the pod</mark>, and you will see that the pod terminated with an error in the logs.

Below illustrates the 4 possible scenarios for resource request and limit combinations:
![Resource Requirements & Limits - CPU](/images/kubernetes/diagrams/2-7-1-resource-requirements-and-limits.png)

1) **No requests, no limits:** One container in a pod can consume all of the resources on the node and can prevent other pods from being created.
2) **No requests, with limits:** In the example above, Kubernetes automatically sets requests equal to limits. In the example above, requests and limits are 3vCPU. So each pod is guaranteed 3 VCPUs, and no more than that due to the limit.
3) **Requests with limits:** In this case, each pod gets a guaranteed number of CPU requests, which is 1 VCPU, and can go up to the defined limits which is 3, but not more. However, we don't want to limit pod as long as pod #2 needs it. Don't unnecessarily limit resources.
4) **Requests, no limits:** In this case, because requests are set, any pod can consume as many CPU cycles as available. At any point in time if pod #2 needs additional CPU cycles, then it will be guaranteed its requested CPU cycle. This is the idea/Scenario.

We said that case 4, resources requested with <mark>no limits is ideal, but there are also good use cases for case 3 (requests with limits)</mark>. A good example is a **multi-tenant** K8s cluster hosting multiple applications. 
- You would definitely want to limit resources to prevent things like Bitcoin mining abuse, fair resource allocation, etc. 
- If you choose not to have limits set, you need to make sure that you have requests set, else you have a scenario like case 1 where other pods may become starved of resources.

The last example was for CPU, but the below illustrates for memory.

![Resource Requirements & Limits - Memory](/images/kubernetes/diagrams/2-7-2-resource-requirements-and-limits.png)
- The same goes for memory, except in cases where there is too much memory in a specific pod, you can't throttle memory; <mark>you have to kill the pod.</mark>
- By default, pods are not given resource requirements or limits. To ensure that they do, you can use limit ranges. Limit ranges help you define default values for containers.

limit-range-cpu.yaml
```
apiVersion: v1
kind: LimitRange
metadata:
  name: limit-range-example
spec:
  limits:
  - default:
      cpu: 500m # limit
    defaultRequest: 
      cpu: 500m # request
    max:
      cpu: "1" # limit
    min:
      cpu: 100m # request
    type: Container

```
- The same goes for memory, except you would specify "memory" instead of "CPU".
- If you edit a limit range, it will not affect the already existing pods, only new ones are created with the updated limits.
- `max` refers to limit and `min` refers to request.

How do you restrict the **total** amount of resources that can be consumed by applications deployed in a k8s cluster? For example, if we had to say that all the pods together shouldn't consume more than a specific amount of CPU or memory at a [[1.16 - Namespaces]] level, you can create resource quotas.

![Resource Requirements & Limits - Quotas](/images/kubernetes/diagrams/2-7-3-resource-requirements-and-limits.png)

resource-quota.yaml
```
apiVersion: v1
kind: ResourceQuota
metadata:
  name: my-resource-quota
spec:
  hard:
    requests.cpu: 4
    requests.memory: "4Gi"
    limits.cpu: 10
    limits.memory: "10Gi"
```
- This resource quota limits the total/requested CPU to 10 and memory to 10Gi, and requests for CPU to 4 and memory for 4Gi.