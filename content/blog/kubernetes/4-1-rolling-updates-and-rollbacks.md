---
title: K8s 4.1 - Rolling Updates and Rollbacks
date: 2024-05-07T07:07:07
summary: Understanding and implementing rolling updates and rollbacks in Kubernetes
---
## Rollouts and Versioning

When a deployment is created, <mark>it initiates a **rollout**,</mark> resulting in a new **deployment revision**. Subsequent upgrades trigger new rollouts, creating additional revisions for tracking changes. This enables seamless rollbacks to previous versions if needed.

![Rollouts](/images/kubernetes/diagrams/4-1-1-rolling-updates-and-rollbacks.png)

To check rollout status and history:

`$ kubectl rollout status <deployment-name>` 
`$ kubectl rollout history <deployment-name>`

# Deployment Strategies
There's two types of deployment strategies:

1. **Recreate Strategy**: Destroys all instances before deploying new versions, causing downtime. This is not the default deployment strategy.
2. **Rolling Update Strategy**: Upgrades instances one by one, ensuring continuous availability. Default strategy if not specified.

# Updating Deployments
Updating could mean updating your application version of Docker containers used, updating their labels, number of replicas, etc. 

Let's take an example deployment definition file:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
  labels:
    app: myapp
    type: front-end
spec:
  template:
    metadata:
      name: myapp-pod
      labels:
	    app: myapp
	    type: front-end
	spec:
	  containers:
	  - name: nginx-container
	    image: nginx:1.7.1
    replicas: 3
    selector:
      matchLabels:
        type: front-end
```

To update the deployment, modify the deployment definition file and apply changes using:
`$ kubectl apply -f deployment-definition.yaml

This is the way we learned how to do this before. An easier, just as valid method is to use the `$ kubectl set image` command like so:
`$ kubectl set image deployment/myapp-deployment nginx-container=nginx:1.9.1`

Be cautious with `$ kubectl set image` as it modifies the configuration file. So you need to be careful when you use the same definition file to make changes in the future.
- When you use kubectl apply with an updated YAML file that includes the new container image, you are essentially <mark>reapplying the entire deployment configuration</mark>. Kubernetes will compare the desired state specified in the YAML file with the current state in the cluster and make necessary updates. This can involve more checks and might impact other parts of the deployment if you make additional changes to the file.
- On the other hand, `kubectl set image` is a more targeted approach specifically designed for updating container images. It's a shorthand method where you only need to specify the deployment, container, and the new image, making it more concise and focused on the image update.

You can also observe the distinction between the **recreate** and r**olling update** strategies by examining the deployment details:
`$ kubectl describe deployment myapp-deployment` 
- If the **recreate** strategy was employed, the events will show that the previous replica set was initially scaled down to zero before the new replica set was scaled up to five. 
- In contrast, when the **rolling update** strategy was utilized, the old replica set underwent gradual scaling down, one at a time, while concurrently, the new replica set was scaled up, one at a time.
# Deployment Upgrade Process
When upgrading, Kubernetes creates a new replica set automatically, deploying containers and taking down old pods simultaneously in a **rolling update** strategy.

You can see this by listing the replica sets:
`$ kubectl get replica sets`
# Rollback
If an update goes awry, use:
`$ kubectl rollout undo <deployment-name>`

This command reverts to the previous revision, bringing back the old replica set. It does this in a similar fashion, destroying the containers one at a time and simultaneously deploying on the previous replicaset.

You can confirm this change by observing the pods on the respective replicasets:
`$ kubectl get replica sets`

In summary: 
- `$ kubectl create` to create deployments
- `$ kubectl get deployments` to list them
- `$ kubectl apply` and `kubectl set image` for updates
- `$ kubectl rollout status` for rollout status
- `$ kubectl rollout undo` for rollbacks.