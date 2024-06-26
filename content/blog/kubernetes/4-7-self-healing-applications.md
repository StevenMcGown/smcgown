---
title: K8s 4.7 - Self-Healing Applications
date: 2024-05-13T07:07:07
summary: Understanding and Implementing Self-Healing Applications in Kubernetes
type: "blog"
---
Kubernetes supports self-healing applications through Replica Sets and Replication Controllers. The replication controller helps in ensuring that a POD is re-created automatically when the application within the POD crashes. It helps in ensuring enough replicas of the application are running at all times.

Kubernetes provides additional support to check the health of applications running within PODs and take necessary actions through **Liveness and Readiness Probes.** 

**Liveness Probes** are used to determine if a container within a pod is still running as expected. Kubernetes periodically executes a specified command within the container, and if the command fails or the container does not respond within a defined timeframe, Kubernetes considers the container to be unhealthy. In response, Kubernetes automatically restarts the container to restore its functionality.
```
livenessProbe:
  exec:
    command:
      - /bin/sh
      - -c
      - ps aux | grep my_application_process
initialDelaySeconds: 10
periodSeconds: 30
```

**Readiness Probes**, on the other hand, evaluate whether a container is ready to serve traffic. By periodically executing a readiness check command, Kubernetes determines if the container is prepared to receive requests. If the readiness probe fails, Kubernetes temporarily removes the pod from the pool of endpoints that receive traffic until the container becomes ready again.

```
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```