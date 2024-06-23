---
title: Docker for Dummies
date: 2021-08-05T07:07:07+01:00
summary: A comprehensive Docker tutorial for beginners
---

![dockerlogo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4psm82g8sqb647mi83kr.png#center)

Docker is one of those services that you always hear about but may have never used. I never used Docker in college, and I actually never heard of it until I began researching the field of DevOps. Knowing how to use Docker is a quintessential element of becoming a part of a modern development team. My goal of this post is to help the reader gain an understanding of what Docker is, to learn why enterprise teams are adopting it today, and how to get started using Docker.

If you already know how to use Docker, consider reading my post about [managing containers using Kubernetes](https://dev.to/stevenmcgown/kubernetes-for-dummies-5hmh).

# Questions to answer:
- What problems does Docker solve?
- What are containers?
- What is the difference between a container and a VM?
- What is the difference between images and containers?
- How does Docker help create applications?

### Why Docker?
The need for Docker arises from virtual machines on servers being used at large scales. Take a large business for example. For a business that uses hundreds of servers with a cluster of virtual machines for each of their platforms, maintaining these machines is a full-time job. Each server has to have an OS installed, it needs upgrades and patches from time to time, and then dependencies for the applications each machine uses also have to be installed.

You can see why this quickly becomes very complex. Manually configuring these servers is not feasible, so many companies keep a list of servers that they programmatically update. This can work, however, the list of servers is shared between a team of people, and this list does not always stay up to date. Some servers never receive updates and consequently, errors may arise which impact system performance. Finding one faulty server in a room of hundreds can also be a troubleshooting nightmare. How does Docker solve this?

### Docker to the rescue!
Rather than running applications on virtual machines, you can upload Docker images to your server. When an image fails, you just upload a new one. There is no need to worry about configuration because the image exists as an exact replica of the original configuration. In this way, you do not have to worry about installing application dependencies or OS patches because they have already been configured in your Docker image. The Docker setup frees you from treating servers as pets, constantly monitored and cared for, to something more ephemeral; it is okay if the image fails, you can just replace it. "What is an image, and why can it be a better fit than virtual machines?" you might ask. This term will make more sense as we move forward.

Docker is also great for developers. It means no more "It works on my machine" since all the developers are developing with the same stack maintained in the Docker file.

### How does Docker streamline the development process?
**CI/CD:** You can consistently test and deploy your code to different environments in the development process (staging, user acceptance testing, production) without the hassle of configuring various testing environments.

**Versioning:** Docker also helps with versioning, as you can save different versions of software on repositories and check them out later if needed. This eliminates the need for changing versions of software when running an older version of an application.

**Roll Forward:** When defects are found, there is no need to patch or update the application. You just need to use a new image.

### What is the difference between an image and a container?
Docker images and containers are closely related; however, they are distinct. Docker images are immutable, meaning they cannot be changed. I have explained previously that these images can be uploaded to servers in place of running applications directly on an OS. Images contain the source code, libraries, dependencies, tools, and other files that the application needs to run. When using Docker, we start with a base image. Because images can become quite large, images are designed to be composed of layers of other images to allow a minimal amount of data to be sent when transferring images over the network.

![imageandcontainer](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9jxn6fjons4ggrfrnxek.png)

The instance of an image is called a container. Containers are running instances with top writable layers, and they run the actual applications. When the container is deleted, the writable layer is also deleted, but the underlying image remains the same. The main takeaway from this is that you can have many running containers off of the same image. A good way to think about images and containers is with this metaphor: Images are the recipe to make a cake, and containers are the cakes you bake. You can make as many cakes as your resources allow you with a recipe; you can make as many containers as your resources will allow you with an image.

![docker cake](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9t7fkz3s61nzd1t34px5.jpeg)

### What is the difference between virtual machines and containers?
Consider the layout of a typical VM fleet: Virtual machines are managed through a hypervisor, which runs on a host OS that is installed on server hardware. The hypervisor virtualizes hardware that virtual machines use to run their operating systems (Guest OS). So basically the server has a host OS, and the virtual machines themselves have a complete operating system installed.
![helloworld](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/abs51w3ej6bhe3hzxv1s.png)

What makes a container different is that the container does not have a Guest OS. Instead, the container actually virtualizes the operating system. Inside this container, you can build whatever you want. The advantages to using containers over virtual machines are the fast boot-up time and their portability.

### Building images with Dockerfiles
As you can see, Docker helps ease the hassle of installation and configuration. Let's look at a sample Docker command:
`sudo docker run docker/whalesay cowsay Hello-World!`

![images](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6f426u44863qi5wy9hjf.png)

As you can see, the Docker image did not initially exist locally, so it had to be pulled from docker/whalesay. You can also see that the image consists of multiple layers e190868d63f8, 909cd34c6fd7, etc. To create an image, we can create a Dockerfile. Once this file is completed, we will use `docker build [OPTIONS] PATH | URL | -` to create our image.

A Dockerfile can be created using `touch Dockerfile` and can be edited using your favorite text editor. Notice that this file is created without an extension, this is intentional.

In your Dockerfile, type the following code:
![dockerfile](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4cdf79op8zdso1wbt0zq.png)

The `FROM` statement declares what image your new image will be based on. For this sample project, I will be using the ubuntu image. However, if you want to create a Docker image from scratch, you can simply write `FROM scratch`.

`LABEL` is used to apply metadata to Docker objects. In this case, you can use `LABEL` to specify the maintainer of the Docker image. `MAINTAINER` was once used but this is since deprecated.

`RUN` is used to execute commands during the building of the image, while `CMD` is executed only when the container is created out of the image.

In the directory of your Dockerfile, type `docker build .`
![dockerbuild](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mfgovtflb64shwx535x4.png)

The first time each command is executed, each command will be executed. Each command in the Dockerfile is cached, so if you edit the file it will only need to build for the edited command. After editing the echo command of our Dockerfile, we will also give the Docker image a name and the 'latest' tag.
`docker build -t helloworld:latest .`
![built](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wkxhwrf7leudhcytr591.png)

To run your image, first find the image name by running `docker images`.
![dockerimages](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ihsb09q9vjalops1fhuk.png)

Note that you can run a Docker image by its image ID or its name and tag. If you run by name only, Docker will automatically run by the 'latest' tag.

`docker run helloworld:latest` and `docker run 4d6
