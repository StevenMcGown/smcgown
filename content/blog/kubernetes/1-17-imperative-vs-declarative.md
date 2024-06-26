---
title: K8s 1.17 - Imperative vs Declarative
date: 2024-04-21T07:07:07
summary: Comprehensive Overview between Imperative & Declarative Approaches in Kubernetes
type: "blog"
---
**Imperative:** Execute a specific list of instructions to get a desired outcome. If one step fails in the process, the end result is likely to be incorrect or may error out.

**Declarative:** We don't care about how the result is achieved, we give the necessary information to the software and it executes the steps under the hood to achieve the intended result.

In K8s, the **imperative** approach would be issuing commands to create resources through `kubectl`. The **declarative** approach would be to create definition files and applying them using `$ kubectl apply -f filename.yml` command.
- Imperative approach is difficult to use in a large, complex environment but they are quick. This is why creating K8s resources with object definition files, also known as manifest files, helps create exactly what we need the object to look like.
- These files can be stored in a repository through a change/review process. To make changes to these files, you can run the `$ kubectl edit deployment <object-name>` command.
	- This opens a YAML definition file, similar to ones used to create objects, but with some additional fields. For example, `$ kubectl edit deployment nginx` opens `nginx.yaml` pod definition file within the editor.
	- The `status` field is used to store the status of the pod.
	- This file is not the file used to create the object, but a similar file with some additional fields.
- To make changes to the live object, you can make changes to the local file, save and quit, and then run `$ kubectl replace -f nginx.yml`.
- However, note that there is a difference between the live object and the definition file that you have locally.
- Changes made using the `$ kubectl edit` command are not recorded anywhere. So instead, a better way is to make changes to the local file and then run `$ kubectl edit deployment <nginx>`, then `kubectl replace -f nginx.yml`.

What if you run the create command and the object already exists? It would fail with an error that says the pod already exists. Examples like this are why the imperative approach is taxing.

The **declarative** approach is where you use the same object configuration files but instead of create or replace commands we use the `kubectl apply` command to manage objects.
   - The `kubectl apply` command is intelligent enough to create an object if it doesn't already exist.
   - If there are multiple object configuration files, as you usually would have, you can specify that directory instead of just one file.
   - When changes are to be made, simply update the object configuration file and run `$ kubectl apply` command again. This time, it knows that the object exists, so it updates the object with the new changes.
   - TLDR: The `kubectl apply` command can be used to simultaneously update and create K8 resources in an entire directory.
   
<mark>So If you want to quickly create a resource or a deployment with a given image, take the imperative approach. If you have a complex requirement, use the declarative approach.</mark>

To expose a resource with a service, for example a pod, run `$ kubectl expose pod nginx --port 80`.
- Another example: Create a Service named `redis-service` of type Cluster IP to expose a pod `redis` on port `6379`.
- Run `kubectl expose pod redis --port 6379 --name redis-service --dry-run=client -o yaml`. This will automatically set the pod's labels as selectors.
- Or use the command `$ kubectl create service clusterip redis --tcp=6379:6379 --dry-run=client -o yaml`.