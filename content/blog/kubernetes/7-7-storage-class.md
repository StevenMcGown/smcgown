---
title: K8s 7.7 - Storage Class in K8s
date: 2024-06-12T07:07:07
summary: A deep dive into Storage Classes in Kubernetes
---
### Dynamic Provisioning with Storage Classes in Kubernetes

In the previous lectures, we discussed how to create Persistent Volumes (PVs), claim storage with Persistent Volume Claims (PVCs), and use PVCs in pod definition files as volumes. In this post, we will explore dynamic provisioning using storage classes, which simplifies the process of provisioning storage for applications.

### Static & Dynamic Provisioning

Previously, we demonstrated how to create a PVC using an AWS EBS persistent disk. The process required manually provisioning the disk on AWS and then creating a PV definition file with the same disk name. This manual process is called **static provisioning**. It requires manual intervention each time storage is needed for an application, which can be cumbersome.

```
aws ec2 create-volume \
    --size 20 \
    --volume-type gp2 \
    --availability-zone us-east-1a
```

**Dynamic provisioning** automates the creation of PVs when storage is needed. With storage classes, you can define a provisioner that automatically provisions storage and attaches it to pods when a PVC is created.

1. **Storage Class Definition**: A storage class defines a provisioner, such as `kubernetes.io/aws-ebs` for AWS EBS.
2. **Automatic PV Creation**: When a PVC requests storage, the defined provisioner automatically creates a PV and the necessary storage on the cloud provider.

### Creating a Storage Class

Here's how to create a storage class for AWS EBS:

sc-definition.yaml
```
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-storage-class
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
  zones: us-east-1a
```

The **provisioner** specifies the provisioner to use, such as AWS EBS. The **parameters** define additional settings for the provisioner, such as disk type and availability zone.

### Using a Storage Class in a PVC

Because we created a Storage Class, we no longer need to provision PVs manually because <mark>they will automatically be created when the storage class is created.</mark> Therefore, we don't need a PV definition file anymore. We can now specify the storage class name in the PVC definition:

pvc-definition:
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
  storageClassName: ebs-storage-class
```

- **storageClassName**: Links the PVC to the specified storage class. In this case, the name is `ebs-storage`

Again, the storage class then automatically creates a PV and binds the PVC to this new volume. This eliminates the need for manual PV creation, as the storage class handles the entire process.

### Benefits of Storage Classes

Two wrap up, here are some benefits to using Storage classes 
- **Automation**: We discussed before that storage classes automate the provisioning and management of storage.
- **Scalability**: Simplifies storage management in large environments by automating the provisioning and handling of numerous storage requests, ensuring quick and reliable access to storage resources without manual intervention.
- **Flexibility**: Allows the creation of different storage classes for various types of storage, such as standard hard drives, SSDs, or replicated storage. This ensures that applications can use the most appropriate storage type based on their performance needs and budget constraints.
- **Customization**: Supports additional parameters specific to the provisioner, enabling detailed control over how storage is provisioned. For example, with AWS EBS, you can specify disk types, replication modes, and other settings to meet specific application requirements.

Off of that last point of customization, this is why they are called storage classes, because you can create different storage classes tailored to specific needs. For example, you might have the following classes:
- A "basic" storage class with standard hard drives
- A "performance" class with high-speed SSDs
- A "resilient" class with SSDs and data replication
 
This allows you to offer various tiers of storage services, each designed to meet different performance, cost, and reliability requirements.

