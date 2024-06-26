---
title: K8s 7.2 - Volume Driver Plugins
date: 2024-06-07T07:07:07
summary: Exploration & Understanding of Volume Driver Plugins in K8s
type: "blog"
---
Previously when we talked about Docker Storage, we mentioned storage drivers, which are used to manage the storage for Docker images and containers by:
- Maintaining the layered architecture
- Creating writable layers
- Enabling the copy-on-write mechanism

However, to persist data beyond the lifecycle of a container, Docker uses volumes. Volumes are designed to store data on the Docker host or other storage solutions, ensuring data remains intact even when the container is stopped or removed. 

Unlike storage for images and containers, volumes are managed by volume driver plugins, not storage drivers. Volume driver plugins handle the creation, management, and attachment of volumes to containers.

### Default and Third-Party Volume Plugins

The default volume driver plugin is **local**, which creates volumes on the Docker host and stores their data under the `/var/lib/docker/volumes` directory. Other popular volume driver plugins include:
- Azure File Storage
- DigitalOcean Block Storage
- Google Compute Persistent Disks
- REX-Ray
- VMware vSphere Storage

The **REX-Ray** storage driver, for instance, can provision storage on various providers, including:
- **AWS EBS**: `rexray-aws-ebs`
- **Google Persistent Disk**: `rexray-gcepd`
- **Azure File Storage**: `rexray-azure`
- **EMC Isilon**: `rexray-isilon`
- **EMC ScaleIO**: `rexray-scaleio`
- **OpenStack Cinder**: `rexray-cinder`

When running a Docker container, you can specify a volume driver to provision a volume from a specific storage provider. For example, using the REX-Ray EBS driver to provision a volume from Amazon EBS:

```
docker run -it \
    --name mysql \
    --volume-driver rexray/ebs \
    --mount src=ebs-vol,target=/var/lib/mysql \
    mysql
```

This configuration ensures that the data stored in the MySQL database is persisted on the Amazon EBS volume. In this command:
- `--volume-driver rexray/ebs` option tells Docker to use the REX-Ray volume driver for Amazon EBS volumes
- `--mount src=ebs-vol,target=/var/lib/mysql` option specifies that the volume named `ebs-vol` should be mounted to the `/var/lib/mysql` directory inside the container. 

By leveraging various volume driver plugins, you can integrate Docker with numerous storage solutions, ensuring your data is persisted and managed according to your requirements.