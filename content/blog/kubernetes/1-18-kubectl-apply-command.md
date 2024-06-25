---
title: K8s 1.18  the kubectl apply Command
date: 2024-04-22T07:07:07
summary: Deep dive into the usage, best practices and scenarios for the 'kubectl apply' command in Kubernetes
---
The `$ kubectl apply` is a declarative command which takes into consideration the <mark>local configuration file</mark>, the <mark>live object definition</mark> on K8s, and the <mark>last applied configuration</mark> before making a decision on what changes are to be made.
- **Local Configuration File:**  A YAML or JSON file specifying the desired state of Kubernetes resources.
- **Live Object Definition on Kubernetes:** The current state of Kubernetes objects within the cluster at the time of the `$ kubectl apply` command.
- **Last Applied Configuration:** The record of the configuration that was last successfully applied to Kubernetes objects, stored as an annotation, assisting in determining changes since the last apply.

If the object does not exist, then the object is created. When the object is created, an object configuration, similar to what we created locally, is created as a JSON object within K8s. This is known as the live object configuration.
- The YAML version of the local object configuration file is converted to a JSON format and is then stored as the last applied configuration.
- Going forward, for any updates to the object, all three are compared to identify what changes are to be made on the live object.

Example: Updating the image version in a YAML file and running `$ kubectl apply`:
  1) The image in the local YAML file is updated to 1.19.
  2) The version number is compared to the number in the live object. If there is a difference, the live configuration is updated with the new value.
  3) The last applied configuration JSON file is updated with the new value so that it is always up to date.

The **last applied configuration** is important because it serves as a reference point between the 3 files. This is for both changes to primitive fields and map fields.

| Field/key in **local object** config | Field/key in **live** config | Field/key in **last applied** config | Action |
| :--: | :--: | :--: | ---- |
| Yes | Yes | - | Set live to local config value |
| Yes | No | - | Set live to local config value |
| No | - | Yes | Clear from live configuration |
| No | - | No | Do nothing, keep live value |

  Keep in mind that this whole process is for the `$ kubectl apply` command and not for **imperative** `$ kubectl create` or `$ kubectl replace` commands.