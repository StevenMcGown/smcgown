---
title: K8s 2.5 - Node Affinity in Kubernetes
date: 2024-04-28T07:07:07
summary: Understanding and Implementing Node Affinity in K8s Environments
---
The purpose of node affinity is to <mark>ensure that pods are assigned to particular nodes.</mark> Node Selectors also do this, but with much less capabilities.
- Node affinity provides much more capabilities, but is much more complex.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
spec:
  containers:
  - name: data-processor
    image: data-processor
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
	    nodeSelectorTerms:
	    - matchExpressions:
	          - key: size
	            operator: In
	            values:
	            - Large
	            - Medium
```
- This **requiredDuringSchedulingIgnoredDuringExecution** rule states that pods will only be scheduled on nodes that meet the specified affinity rules. However, once the pod is running, <mark>if the node labels change & no longer satisfy, it will continue to run.</mark>
- There are other variations of this. If you read the names of the node affinity rule, it's pretty self explanatory what it does, but here's a table in case it wasn't totally clear:

|  | During Scheduling | During Execution |
| ---- | ---- | ---- |
| **required**DuringScheduling**Ignored**DuringExecution | Required | Ignored |
| **preferred**DuringScheduling**Ignored**DuringExecution | Preferred | Ignored |
| **required**DuringScheduling**Required**DuringExecution | Required | Required |

Node affinity and pod affinity in Kubernetes allow you to specify rules for scheduling pods based on node or pod labels. These rules use logical operators to define conditions for pod placement. Below are the logical operators you can use in the operator field for nodeAffinity and podAffinity:

| Operator     | Behavior                                                                |
|--------------|-------------------------------------------------------------------------|
| In           | The label value is present in the supplied set of strings               |
| NotIn        | The label value is not contained in the supplied set of strings         |
| Exists       | A label with this key exists on the object                              |
| DoesNotExist | No label with this key exists on the object                              |

The following operators can only be used with `nodeAffinity`.

| Operator | Behaviour                                                                                                                                                           |
|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Gt       | The supplied value will be parsed as an integer, and that integer is less than the integer that results from parsing the value of a label named by this selector |
| Lt       | The supplied value will be parsed as an integer, and that integer is greater than the integer that results from parsing the value of a label named by this selector |
