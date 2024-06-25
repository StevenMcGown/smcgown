---
title: K8s 1.10  Replicasets
date: 2024-04-14T07:07:07
summary: An in-depth look at managing and manipulating Kubernetes Replicasets.
---
Recall that Kubernetes controllers are the processes that monitor K8s objects.
- The replication controller helps ensure high availability by spinning up new pods whenever old ones go down, thus maintaining the specified number of pods running at all times.
- You can also use them for Load Balancing to Scaling. For example, if the amount of traffic going to a pod has become too much, the replication controller delays more pods to distribute the traffic across them.
- As demand increases (in the scenario where you run out of resources in a node), you can deploy more pods to other nodes.
- ReplicationControllers and ReplicaSets have the same purpose, but they are not the same. <mark>The **replication controller** is an older technology that is being replaced by replica set.</mark>

replica-controller-definition.yaml:
```
apiVersion: v1
kind: ReplicationController
metadata:
  name: myapp-rc
  labels:
    app: myapp
    type: front-end
spec:
  template:
    metadata:
	  name: myapp
      labels:
        name: myapp
        type: front-end # this is what identifies the pod for monitoring
    spec:
      containers:
        - name: nginx-container
          image: nginx
  replicas: 3
```

replica-set-definition.yaml:
```
apiVersion: v1
kind: ReplicationSet
metadata:
  name: myapp-rc
  labels:
    app: myapp
    type: front-end
spec:
  template:
    metadata:
	  name: myapp
      labels:
        name: myapp
        type: front-end
    spec:
      containers:
        - name: nginx-container
          image: nginx
  replicas: 3
  selector:           #
    matchLabels:      # this is what identifies the pod for monitoring
      type: front-end # 
```

pod-definition.yaml:
```
apiVersion: v1
kind: Pod
```

The reason for labeling pods and objects in K8s is so that the replica set can monitor the pods. In a space where hundreds of pods are being used for several applications, the replica set knows which pods to monitor by the labels on the pods. Labels are used in other K8 objects as well.

There are a few ways to scale replica sets:
  1) Change the "replicas" value in the replica-set-definition.yml file. 
     Run `$ kubectl replace -f replicaset` which updates the ReplicaSet to have the updated number of replicas.
  3) Run `$ kubectl scale --replicas=6 -f replicaset-definition.yml` using the same file as input. In this example, the replica set can be scaled to have 6 replicas without having to edit the file. Keep in mind that running this command with the file name as input will not update the file itself. Therefore, if you were to delete this replica set (which in turn would delete any child pods with it) and then recreate the replica set with the same file, it would use the original value of replicas specified in the file.
  4) You can also do the same as above by using the type and name format. The name is filtered by the metadata.
    - `$ kubectl scale --replicas=6 replicaset myapp-replicaset`

- Commands:
  - `$ kubectl create -f replica-set-definition.yml`
  - `$ kubectl get replicaset`
  - `$ kubectl delete replicaset myapp-replicaset`
  - `$ kubectl replace -f replica-set-definition.yml`
  - `$ kubectl scale --replicas=6 -f replica-set-definition.yml`
