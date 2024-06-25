---
title: K8s 2.9  Static Pods
date: 2024-05-02T07:07:07
summary: Overview and utilisation of static pods in Kubernetes
---
Up to this point, all of the pods have been managed by the kubelet through the KubeAPI Server and the kube-scheduler for instructions on deploying pods. The kubelet, however, can deploy static pods by itself. <mark>You may want to do this for bootstrapping purposes.</mark>
- **Node Initialization**: Static pods can be used to run essential system components and services during the node initialization process. For example, components like networking agents, log collectors, or monitoring agents can be started as static pods to ensure they are available early in the pod lifecycle.

Instead of using pod definition files given to the kubelet by the KubeAPI Server, you can configure the kubelet to read definition files from a directory on the server which is designated to store information about pods. 

![Static Pods|Static Pods](/images/kubernetes/diagrams/2-9-1-static-pods.png)

The kubelet periodically checks the `/etc/kubernetes/manifests` directory for definition files. It then reads them and creates Pods from them on the host. 
	- Not only does it create the pod, but it can also ensure that the pod stays alive. 
	- If the application crashes, the kubelet attempts to restart it. 
	- If you make a change to the files in the directory, the kubelet recreates the Pod for those changes to take effect. If you delete the files from the directory, the pod is deleted automatically.
- <mark>You can only create [[1.9 - Pods]] this way, not ReplicaSets, Deployments, or Services, etc. Those require cluster plane components like the replication and deployment controllers, etc.</mark> This why the kubelet only works at a pod level, which is why it can create static Pods this way.
- The location of the directory is passed as an option in the kubelet service: `--pod-manifest-path=/etc/kubernetes/manifests`

kubelet.service
```
ExecStart=/usr/local/bin/kubelet \\
  --container-runtime=remote \\
  --container-runtime-endpoint=unix:///var/run/containerd/containerd.sock
  --pod-manifest-path=/etc/Kubernetes/manifests # This is the option in question
  --kubeconfig=/var/lib/kubelet/kubeconfig \\
  --network-plugin=cni \\
  --register-node=true \\
  --v=2
```

Instead of specifying this path directly in the kubelet.service file, you can also use the `--config` option with a YAML config. Clusters set up by the kubeadmin tool use this approach. For example, `--config=kubeconfig.yaml`

kubelet.service
```
ExecStart=/usr/local/bin/kubelet \\
  --container-runtime=remote \\
  --container-runtime-endpoint=unix:///var/run/containerd/containerd.sock
  --config=kubeconfig.yaml \\
  --kubeconfig=/var/lib/kubelet/kubeconfig \\
  --network-plugin=cni \\
  --register-node=true \\
  --v=2
```

And here's what the YAML file referenced contains:

kubeconfig.yaml
```
staticPodPath: /etc/kubernetes/manifests
```
- You should know how to do both approaches when inspecting an existing cluster.
- You can view static pods on a cluster by running the relevant commad for each runtime, e.g. `$ docker ps`, `$ nerctl ps`, `$ crictl ps`, etc.
	- The reason you run the `$ docker ps` command (or other relevant runtime command) and not any other **kubectl** command as before is because the kubectl utility works with the kube-apiserver. <mark>Since there is no [[1.4 - Kube API Server]] for static pods, you must use the docker command.</mark>

There are other questions to consider. How does the Kubelet work when the node is part of a cluster when there is an API server requesting the Kubelet to create Pods? Can the Kubelet create both kinds of Pods at the same time? Well, the Kubelet can create pods by using different inputs:
1) **Static pods:** Through **pod definition files** from the Static Pods folder as mentioned above
2) **Normal pods:** Through an **HTTP API endpoint,** which is how the Kube-apiserver provides input to the Kubelet

Is the KubeAPI Server aware of the static Pods created by the Kubelet? Yes! If you run `$ kubectl get pods`, the static Pods will show as well.
- This is because when the kubelet creates a static Pod, if it is part of a cluster, it also creates a mirror object in the kube-apiserver.
- What you see from the kube-apiserver is actually just a mirror of the Pod.
- However, using the API server, you cannot edit or delete the static pods, that must be done by modifying the files from the node's manifest folder.
- You can also note that the name of the Pod is automatically appended with the Node name.

Knowing all this, why even use static pods?
- Static pods are advantageous because <mark>instead of installing control plane components through the process of downloading binaries, configuring services with the risk of a service crashing, you can deploy the essential control plane components directly as Pods on a node</mark>. These pods will then operate independently of the Kubernetes control plane.
  - This is done by installing Kubelet on the master nodes, creating Pod definition files with Docker images of the control plane components, and placing these files in a designated manifest folder.
  - The Kubelet can then handle the deployment of control plane components as Pods on the cluster, and if they crash, they are restarted by the Kubelet.
  - This method aligns with how the kubeadm tool establishes Kubernetes clusters, and is why the control plane components are listed as Pods in a cluster set up by the Kubeadm tool.

Static Pods and Daemonsets are both used to ensure pods are deployed in a Kubernetes cluster, but they serve distinct purposes. 
- Static Pods are managed locally by the kubelet on a specific node, often for node-specific services and not part of the cluster-wide abstraction. 
- In contrast, DaemonSets, managed by the control plane, ensure a copy of a specified pod runs on every node, commonly employed for deploying cluster-level services or agents.

| Static Pods | DaemonSets |
| ---- | ---- |
| - Created by the kubelet<br>- Deploy control plane components as static pods | - Created by the Kube API Server (Daemonset controller)<br>- Deploy monitoring agents, logging agents nodes |
Both static pods and daemonsets are ignored by the kube-scheduler!