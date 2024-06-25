---
title: K8s 2.1 - Manual Scheduling in K8s
date: 2024-04-24T07:07:07
summary: Comprehensive Guide on Manual Scheduling in Kubernetes
---
The scheduler is responsible for placing containers (pods) onto available nodes in the cluster. Its primary role is to <mark>ensure that pods are scheduled to run on nodes that meet their resource requirements and satisfy any constraints</mark> specified in the pod configuration.

How does a scheduler work on the backend? Take pods for example.
- Every pod has a field called "nodeName" that by default is not set.
- You don't typically specify this field, k8s adds it automatically.
- The scheduler goes through all the pods and looks for those that do not have this property set. These are the candidates for scheduling. It then identifies the right node for the pod by running the scheduling algorithm. Once identified, it schedules the pod on the node by setting the nodeName property to the name of the node by creating a binding object.
 
If there is no scheduler to monitor and schedule nodes, pods continue to be in a pending state.
- You can manually assign pods to nodes yourself by setting the nodeName field, but as mentioned above, this is not generally done.
- Kubernetes does not allow you to modify the nodeName field of a pod once it has been created, so if you want to assign a node to a pod after the pod has already been created, you can mimic the scheduler by creating a binding object and sending a POST request to the Pod's binding API, mimicking what the scheduler actually does.

pod-definition.yml
```
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    name: nginx
spec:
  containers:
    - name: nginx
      image: nginx
      ports:
        - containerPort: 8080
      nodeName: node02 # This is the field of interest
```
- In the binding object, you specify a target node with the name of the node, then send a POST request to the Pods binding API with the data set to the binding object in JSON format.

pod-bind-definition.yaml
```
apiVersion: v1
kind: Binding
metadata:
  name: nginx
target:
  apiVersion: v1
  kind: Node
  name: podbind
```

So, you must convert the YAML into its equivalent JSON form.

pod-bind.json
```
{
  "apiVersion": "v1",
  "kind": "Binding",
  "metadata": { "name": "nginx" },
  "target": {
    "apiVersion": "v1",
    "kind": "Node",
    "name": "node02"
  }
}
```
`$ curl --header "Content-Type:applicatoin/json" --request POST --data {<contents of the json file>} http://target-server/api/v1/namespaces/default/pods/pod-name/binding`