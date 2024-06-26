---
title: K8s 6.15 - Docker Security in K8s
date: 2024-06-02T07:07:07
summary: Deep Dive into Docker Security Measures for K8s Applications
type: "blog"
---
In this post, we will look at the various concepts related to security in Docker. Let's start with a host with Docker installed on it. 

![Security Contexts](/images/kubernetes/diagrams/6-15-1-docker-security.png)

This host has a set of its own processes running, such as a number of operating system processes, the Docker daemon itself, the SSH server, etc (listed as process 1,2,3,4). We will now run an Ubuntu Docker container that runs a process that sleeps for an hour. 

`$ docker run ubuntu sleep 3600`

We have learned that <mark>unlike virtual machines, containers are not completely isolated from their host. Containers and the host share the same kernel.</mark>
- Containers are isolated using **namespaces** in Linux. The host has a namespace and the containers have their own namespace. 
- All the processes run by the containers are in fact <mark>run on the host itself but in their own namespace</mark>. 
 
As far as the Docker container is concerned, it is in its own namespace and it can see its own processes only. It cannot see anything outside of it or in any other namespace.
- So when you list the processes from within the Docker container, you see the sleep process with a process ID of one: `$ ps aux`

![Pasted image 20240518145335.png](/images/kubernetes/images/Pasted-image-20240518145335.png)

 For the Docker host, all processes of its own, as well as those in the child namespaces, are visible as just another process in the system. So when you list the processes **on the host,** you see a list of processes, including the sleep command but with a different process ID. 
![Pasted image 20240518145245.png](/images/kubernetes/images/Pasted-image-20240518145245.png)

This is because the processes can have different process IDs in different namespaces, and that's how Docker isolates containers within a system.

### User Security

Let us now look at users in the context of security. The Docker host has a set of users, a root user, as well as a number of non-root users. By default, Docker runs processes within containers as the root user. This can be seen in the output of the commands we ran earlier. Both within the container and outside the container on the host, the process is run as the root user. 

![Pasted image 20240518145335.png](/images/kubernetes/images/Pasted-image-20240518145335.png)
![Pasted image 20240518145245.png](/images/kubernetes/images/Pasted-image-20240518145245.png)

Now, if you do not want the process within the container to run as the root user, you may set the user using the user option within the Docker run command and specify the new user ID. 
`$ docker run --user-1000 ubuntu sleep 1000`
`$ ps aux`

![Pasted image 20240518145641.png](/images/kubernetes/images/Pasted-image-20240518145641.png)

You will see that the process now runs with the new user ID.

### Defining User Security in Docker Images

Another way to enforce user security is to have this defined in the Docker image itself at the time of creation. For example, we will use the default Ubuntu image and set the user ID to 1,000 using the user instruction, and build the custom image. 
```
FROM ubuntu

USER 1000
```
`$ docker build -t my-ubuntu-image .`

We can now run this image without specifying the user ID and the process will be run with the user ID 1,000.

`$ docker run my-ubuntu-image sleep 3600`

![Pasted image 20240518145848.png](/images/kubernetes/images/Pasted-image-20240518145848.png)
### Root User and Security Features

Let us take a step back. What happens when you run containers as the root user? Is the root user within the container the same as the root user on the host? Can the process inside the container do anything that the root user can do on the system? If so, isn't that dangerous? Well, **Docker implements a set of security features that limits the abilities of the root user within the container.** So the root user within the container **isn’t really like the root user on the host**. Docker uses Linux capabilities to implement this.

As we all know, the root user is the most powerful user on a system. The root user can literally do anything, and so does a process run by the root user. It has unrestricted access to the system, from modifying files and permissions on files, access control, creating or killing processes, setting group ID or user ID, performing network-related operations, such as binding to network ports, broadcasting on a network, controlling network ports, system-related operations, like rebooting the host, manipulating the system clock, and many more. 

All of these are the different capabilities on a Linux system and you can see a full list at this location: `/usr/include/linux/capability.h`

### Controlling Capabilities

You can now control and limit what capabilities are made available to a user. By default, Docker runs a container with a limited set of capabilities. And so the processes running within the container do not have the privileges to say reboot the host or perform operations that can disrupt the host or other containers running on the same host.

If you wish to override this behavior and provide additional privileges than what is available, use the `--cap-add` option in the Docker run command.
- e.g. `$ docker run --cap-add MAC_ADMIN ubuntu`

Similarly, you can drop privileges as well using the `--cap-drop` option. 
- e.g. `$ docker run  --cap-drop KILL ubuntu`

Or in case you wish to run the container with all privileges enabled, use the privileged flag: `$ docker run --priviliged ubuntu`