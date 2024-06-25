---
title: K8s 7.6 - Persistent Volume Claims
date: 2024-06-11T07:07:07
summary: Understanding and Managing Persistent Volume Claims in K8s
---
In the previous post, we created a Persistent Volume. Now, we will create a Persistent Volume Claim to make the storage available to a pod.

Persistent Volumes (PVs) and Persistent Volume Claims (PVCs) are two separate objects in the Kubernetes namespace. An administrator creates a set of persistent volumes, and users create persistent volume claims to use the storage. Once a PVC is created, Kubernetes binds it to a suitable PV based on the request and properties set on the volume.

### Binding Process

1. **Binding**: Every PVC is bound to a single PV. During the binding process, Kubernetes finds a PV with **sufficient capacity** and **matching properties** (e.g., access modes, volume modes, storage class).
2. **Matching**: If multiple PVs match a PVC, labels and selectors can be used to bind to a specific volume.
3. **Size Mismatch**: A smaller claim may get bound to a larger volume if it matches the other criteria, but no other PVs are available. <mark>The remaining capacity in the PV cannot be used by other claims</mark>.
4. **Pending State**: If no PVs are available, the PVC remains in a **pending state** until new volumes are added to the cluster. The claim will automatically bind to a newly available volume.

### Creating a Persistent Volume Claim

pvc-definition.yaml
```
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: my-claim
    spec:
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 500Mi
```

This Persistent Volume Claim (PVC) requests 500Mi of storage with read/write access from a suitable Persistent Volume. Kubernetes will bind this PVC to a single PV that has at least 500Mi capacity and supports the ReadWriteOnce access mode. If no matching PV is available, the PVC will remain in a pending state until a suitable PV is added to the cluster.

Create and list PVCs:
```
    $ kubectl create -f pvc-definition.yaml
    $ kubectl get persistentvolumeclaims
```

Let's take the previous Persistent Volume we created into consideration:

pv-definition.yaml
```
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-vol1
spec:
  accessModes:
    - ReadWriteOnce
  capacity:
    storage: 1Gi
  awsElasticBlockStore:
    volumeID: "<volume-id>"
    fsType: ext4
```

After creating the PVC, Kubernetes attempts to bind it to a suitable PV:
- **Access Modes Match**: The PV's access modes match the PVC's (ReadWriteOnce)
- **Capacity**: The PV's capacity is 1 GB, which is larger than the requested 500 MB, so the PVC can be bound to it.

When you run the `$ kubectl get persistentvolumeclaims` command again, you should see that the PVC is bound to the PV.

### Using a Persistent Volume Claim (PVC) in a Pod

Once you create a PVC, you can use it in a Pod definition file by specifying the PVC claim name under the `persistentVolumeClaim` section in the `volumes` section. Here’s an example:

```
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
    - name: myfrontend
      image: nginx
      volumeMounts:
        - mountPath: "/var/www/html"
          name: mypd
  volumes:
    - name: mypd
      persistentVolumeClaim:
        claimName: myclaim
```

The same approach applies to ReplicaSets or Deployments. Add the volume configuration to the pod template section of a Deployment or ReplicaSet.

deployment-definition.yaml
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myfrontend
          image: nginx
          volumeMounts:
            - mountPath: "/var/www/html"
              name: mypd
      volumes:
        - name: mypd
          persistentVolumeClaim:
            claimName: myclaim

```

In these examples, the PVC named `myclaim` is used to provide persistent storage for the `myfrontend` container running the `nginx` image. This setup ensures that the data remains consistent across pod restarts and rescheduling.

### Deleting a PVC

To delete a PVC, use the following command:
```
kubectl delete persistentvolumeclaim my-claim
```

When a PVC is deleted, the underlying PV can be handled in different ways:
1. **Retain** (default): The PV remains and is not available for reuse until manually deleted by the administrator.
2. **Delete**: The PV and its data are deleted automatically, freeing up storage on the storage device.
3. **Recycle**: The PV's data is scrubbed, and the PV is made available for reuse by other claims.

To set the reclaim policy, specify it in the PV definition:

pv-definition.yaml
```
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-vol1
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain  # or Delete, or Recycle
  awsElasticBlockStore:
    volumeID: "<volume-id>"
    fsType: ext4
```

In this example, to reclaim policy is set to `Retain` and therefore it will not be available for reuse until manually deleted by the administrator.