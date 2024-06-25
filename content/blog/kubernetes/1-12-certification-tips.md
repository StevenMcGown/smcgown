---
title: K8s 1.12 - Certification Tips
date: 2024-04-16T07:07:07
summary: Essential tips and strategies for achieving certification in Kubernetes 1.12
---
 If you want to create a template YAML file via the CLI, you can simply run `$ kubectl run`

Create an NGINX pod: `$ kubectl run nginx --image=nginx`

Generate a Pod manifest YAML file with `kubectl run`: `$ kubectl run nginx --image=nginx --dry-run=client -o yaml`
- The `--dry-run` flag essentially simulates the execution of the command without making changes to the cluster.
- Use `-o yaml` to specify the output format as YAML.

Similarly, you can do the same thing with deployments and save it to a file: `$ kubectl create deployment --image=nginx nginx --dry-run=client -o yaml > nginx-deployment.yaml`

Make necessary changes to the YAML file (e.g., more replicas) and create the deployment: `$ kubectl create -f nginx-deployment.yaml`

In Kubernetes version 1.19 or above, you can specify the `--replicas` option when creating a deployment: `$ kubectl create deployment --image=nginx nginx --replicas=4 --dry-run=client -o yaml > nginx-deployment.yaml`