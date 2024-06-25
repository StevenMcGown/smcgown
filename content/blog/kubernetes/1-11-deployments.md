---
title: K8s 1.11 - Deployments
date: 2024-04-15T07:07:07
summary: Detailed guide on Deployments in Kubernetes
---
You might want to perform rolling updates to deploy newer versions of an application, i.e. not update them all at once but rather one after the other. This ensures users have access to the application during the upgrade. If one of the updates unexpectedly fails, you want to be able to roll back. If you want to be able to make multiple changes to your environment such as upgrading versions, scaling, or modifying resource allocations, you don't want to do it all at once.

![Deployments](/images/kubernetes/diagrams/1-11-1-deployments.png)

To create a Deployment, it is similar to creating a Replica Set with a YAML file, except that now the kind is *Deployment*.

deployment-definition.yaml:
  ```
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: myapp-deployment
    labels:
      app: myapp
      type: front-end
  spec: # Start of the pod template
    template: 
      metadata:
	    name: myapp
        labels:
          name: myapp
          type: front-end
      spec:
        containers:
          - name: myapp-container
            image: myapp:v1
  replicas: 3
  selector:
    matchLabels:
      type: front-end
        
  ```

Create the deployment using the template file:
  ```
  $ kubectl create -f deployment-definition.yaml
  ```

Get deployments to show the new deployment:
  ```
  $ kubectl get deployments
  ```

Also getting the replica sets will show the replicas created in the deployment:
  ```
  $ kubectl get replicasets
  ```

Likewise, running a get on the pods will return all the pods created by the replica set, which was defined by the deployment template file:
  ```
  $ kubectl get pods
  ```

To see all aspects created at once:
  ```
  $ kubectl get all
  ```