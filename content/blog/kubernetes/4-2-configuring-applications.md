---
title: K8s 4.2 - Configuring Applications
date: 2024-05-08T07:07:07
summary: Detailed guide on how to properly configure applications in Kubernetes
---
Configuring applications comprises of understanding the following concepts:
1) Configuring Command and Arguments on applications
2) Configuring Environment Variables
3) Configuring Secrets

# Configuring Command and Arguments on applications

Imagine running a Docker container from an Ubuntu image. 
`$ docker run ubuntu`

Unlike virtual machines, containers are task-specific and exit once the assigned process completes.  So if you were to list all of the running containers, you wouldn't see the container running. 
`$ docker ps`

If you list all containers including those that have stopped, you will see that the new container you ran is in an exited state.
`$ docker ps -a`

Again, containers are meant to run specific tasks like instances of webserver, database, processing tasks; they are not running an operating system, for example.

Docker uses instructions like CMD in Docker files to define the program to run within the container. In this case, the command is `nginx`
```
# Install Nginx.
RUN \
  add-apt-repository -y ppa:nginx/stable && \
  apt-get update && \
  apt-get install -y nginx && \
  rm -rf /var/lib/apt/lists/* && \
  echo "\ndaemon off;" >> /etc/nginx/nginx.conf && \
  chown -R www-data:www-data /var/lib/nginx

# Define mountable directories.
VOLUME ["/etc/nginx/sites-enabled", "/etc/nginx/certs", "/etc/nginx/conf.d"]

# Define working directory.
WORKDIR /etc/nginx

# Define default command.
CMD ["nginx"]
```

Let's also look at the Dockerfile for Ubuntu.
```
# Pull base image.
FROM ubuntu:14.04

# Install necessary packages and tools.
RUN \
  sed -i 's/# \( .* multiverse$\)/\1/g' /etc/apt/sources.list && \
  apt-get update && \
  apt-get -y upgrade && \
  apt-get install -y build-essential && \
  apt-get install -y software-properties-common && \
  apt-get install -y byobu curl git htop man unzip vim wget && \
  rm -rf /var/lib/apt/lists/*

# Add configuration files.
ADD root/.bashrc /root/.bashrc
ADD root/.gitconfig /root/.gitconfig
ADD root/.scripts /root/.scripts

# Set environment variables.
ENV HOME /root

# Define working directory.
WORKDIR /root

# Define default command.
CMD ["bash"]
```
The default command is `bash` - `bash` is not a process like `nginx` above, rather it's a shell that listens for inputs from a terminal. If it cannot find a terminal, it exits. 
- By default, Docker does not attach a terminal to a container upon its execution. Consequently, the bash program cannot find the terminal and exits. This is why earlier when we ran `$ docker run ubuntu`, it immediately exited.

As the process initiated during the container's creation concludes, the <mark>container exits as well</mark>. Now, the question arises: How do you specify a different command to initiate the container?
- One approach is to append a command to the `$ docker run` command, thereby overriding the default command specified within the image. For example: `$ docker run ubuntu sleep 5`
- This executes the `$ docker run ubuntu` command with the additional option of `sleep 5`. Consequently, when the container begins, it executes the sleep program, waits for five seconds, and then exits. 

If you wanted to make this change permanent, i.e. you always wanted the image to run the sleep command when it starts, you create your own image from the base Ubuntu image and specify the new command. You can do this one of two ways:

1) As is in a shell form
```
FROM Ubuntu

CMD sleep 5
```
2) In a JSON array format
```
FROM Ubuntu

CMD ["sleep", "5"]
```
- When you specify in JSON array format, the first argument should be the executable. In this case, it is the `sleep` program.

DO NOT specify the command and the parameters together in the same argument like this:
```
FROM Ubuntu

CMD ["sleep 5"]
```

You can now build the new image and run it using:
`$ docker build -t ubuntu-sleeper .`
`$ docker run ubuntu-sleeper`

If you want to change the number of seconds it sleeps, you can run the `$ docker run` command with the new command appended to it. This essentially overrides the parameters specified in the CMD instruction
`$ docker run ubuntu-sleeper sleep 10`

However, the command would ideally look like this, where the user only has to specify the number of seconds they wish the ubuntu-sleeper to run.
`$ docker run ubuntu-sleeper 10`
- To do this, we can make use of the ENTRYPOINT instruction
```
FROM Ubuntu

ENTRYPOINT ["sleep"]
```

Now there's a new problem though. If someone were to run `$ docker run ubuntu-sleper` (without specifying the number of seconds) then it will simply run the command by itself. In this case doing so would result in a 'missing operand' error.

To overcome this you can use both the ENTRYPOINT and CMD instructions to make a default value when none is specified.
```
FROM Ubuntu

ENTRYPOINT ["sleep"]

CMD ["5"]
```
- If you do provide a number of seconds to sleep, it will override the value, e.g. `$ docker run ubuntu-sleeper 10`

If you want to override the *entrypoint* instead of the argument, you could run e.g.:
`$ docker run --entrypoint sleep2.0 ubuntu-sleeper 10` 
- where `sleep2.0` is overriding the `sleep` entrypoint.

---
Let's use the above concepts to understand commands and arguments within a Kubernetes pod. We crafted a straightforward Docker image called Ubuntu sleeper, designed to pause for a specified duration. Executing it using the command `$ docker run ubuntu-sleeper` defaults to a five-second nap, yet you have the flexibility to modify this duration by introducing a command line argument.

Now, let's transition into the creation of a pod utilizing this image. Commencing with an empty pod definition template, we input the pod's name and designate the image.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: ubuntu-sleeper-pod
spec:
  containers:
    - name: ubuntu-sleeper
      image: ubuntu-sleeper
      args: ["10"]
```
Upon pod creation, it generates a container from the specified image, executing a five-second sleep before gracefully exiting.
- Anything that is appended to the docker run command will go into the **args** property of the pod definition file, in the form of an array like above.

Like before, the Dockerfile has an ENTRYPOINT and an entry point and a CMD instruction. The entry point is the command executed at startup, and CMD provides the default parameter.

```
FROM Ubuntu

ENTRYPOINT ["sleep"]

CMD ["5"]
```

In the pod definition file, the args option allows us to override the CMD instruction. But what if we want to override the entry point, like transitioning from 'sleep' to an imaginary 'sleep 2.0' command?
![Configuring Applications](/images/kubernetes/diagrams/4-2-1-configuring-applications.png)

In the Docker world, we use the `$ docker run` command with the entry point option set to the new command. Two fields in the pod definition file correspond to instructions in the Dockerfile. 
- The `command` field overrides the ENTRYPOINT instruction
- The `args` field overrides the CMD instruction. 
- Remember, <mark>the command field does not override the CMD instruction.</mark>

---
# Configuring Environment Variables

We can also set environment variables with Docker and Kubernetes. For example:
- `$ docker run -e APP_COLOR=pink simple-webapp-color`

The following pod definition file uses the same image as the docker command we used above. To set an environment variable in a pod definition file, use the `env` property.
```
apiVersion: v1
kind: Pod
metadata:
  name: simple-webapp-color
spec:
  containers:
  - name: simple-webapp-color
    image: simple-webapp-color
    ports:
      - containerPort: 8080
    env:
      - name: APP_COLOR
        value: pink
```

`env` is an array, so every item under the `env` property starts with a dash indicating an item in the array.
- Each item has a name and a value property. The name is the name of the environment variable made available within the container, and the value is its value.

What we just saw was one way of specifying the environment variables using your **plain key-value** pair format. There are other ways of setting the environment variables, such as using **config maps** and **secrets**.
```
# Plain Key value
env:
  - name: APP_COLOR
  - value: pink

# ConfigMap
env:
  - name: APP_COLOR
    valueFrom:
      configMapKeyRef: # this is the difference

# Secrets
env:
  - name: APP_COLOR
    valueFrom:
      secretKeyRef: # this is the difference
```
The difference from specifying a plain key value is that instead of specifying a value outright, we say valueFrom and then a specification of `configMapKeyRef` or `secretKeyRef`

While plain key-value pairs are suitable for straightforward, static configurations, ConfigMaps and Secrets provide a more **dynamic** and secure approach when dealing with configurations that <mark>may change or contain sensitive information</mark>. 
- ConfigMaps are preferable for non-sensitive configuration
- Secrets offer added security for sensitive data. Choosing the right method depends on the specific requirements and sensitivity of the configuration data.