---
title: K8s 10.1 - Provisioning VMs for a K8s Cluster with Vagrant 
date: 2024-08-29T07:07:07  
summary: A step-by-step guide to provisioning virtual machines for a Kubernetes cluster using Vagrant, including setup for a single master node and two worker nodes.  
type: "blog"  
---

In this post, we will provision VMs for a Kubernetes cluster consisting of a single master node and two worker nodes. **This setup is a prerequisite for bootstrapping the Kubernetes cluster using kubeadm**, which we will cover in the next post.

### **Prerequisites**  
Ensure the following tools are installed:

1. **Your Choice of VM Software** – The hypervisor that runs the virtual machines.  
   - Options include **VirtualBox**, **VMware**, or **Virtual Machine Manager (libvirt)**.  
   - I ran into issues when trying to do this with VirtualBox. For that reason, I am using **Virtual Machine Manager (VMM)** with the **libvirt** provider. This approach should also provide more transparency into the provisioning process.

2. **Vagrant** – An automation tool to simplify VM creation and configuration.  
   - Follow the installation guide on the [Vagrant documentation](https://www.vagrantup.com/docs/installation) based on your operating system. In this guide, I am using Ubuntu.

3. **Sufficient Host Machine Resources** – Ensure your system meets these hardware requirements for smooth operation:
   - CPU: At least 6 cores (e.g., a quad-core with hyper-threading)
   - RAM: 16 GB or more
   - Disk Space: At least 100 GB of free space

---

### **Clone the Repository and Install Required Tools**

#### **Step 1: Install Virtual Machine Manager (VMM) and Libvirt Dependencies**  
Install the required packages for libvirt:

```
sudo apt-get update
sudo apt-get install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virt-manager
sudo systemctl enable --now libvirtd
sudo usermod -aG libvirt $(whoami)
sudo usermod -aG kvm $(whoami)
newgrp libvirt
```

#### **Step 2: Clone the Repository**  
Clone the repository containing the Vagrantfile:

```
git clone https://github.com/techiescamp/vagrant-kubeadm-kubernetes.git
cd vagrant-kubeadm-kubernetes
```

#### **Step 3: Install Vagrant and the Libvirt Plugin**  
Install Vagrant and the libvirt plugin:

```
sudo apt-get install -y vagrant
vagrant plugin install vagrant-libvirt
```

#### **Step 4: Verify Installation**  
Confirm that Vagrant and libvirt are correctly installed:

```
vagrant --version
virsh list --all
```

---

### **Modifying the Vagrantfile**

The `Vagrantfile` provided by the repository is initially configured for VirtualBox. To run it with the libvirt provider, make the following modifications. The repository’s `Vagrantfile` typically uses a `settings` hash (defined in the file or a separate configuration file) for CPU and memory settings. If you’re unsure where these values come from, check the `Vagrantfile` or accompanying documentation in the repository.

1. **Set the Default Provider to Libvirt**:
   Add this line at the top of the `Vagrantfile`:
   ```
   ENV['VAGRANT_DEFAULT_PROVIDER'] = 'libvirt'
   ```

2. **Enable NFS with Version 3**:
   Update the synced folder configuration. For example:
   ```
   config.vm.synced_folder ".", "/vagrant", type: "nfs", nfs_version: "3", nfs_udp: false
   ```

3. **Update the Provider Settings**:
   Modify the `controlplane` and `node` provider blocks to specify CPU, memory, and driver settings for libvirt. For example:
   ```
   controlplane.vm.provider "libvirt" do |libvirt|
     libvirt.cpus = settings["nodes"]["control"]["cpu"]
     libvirt.memory = settings["nodes"]["control"]["memory"]
     libvirt.machine_type = "pc"
     libvirt.driver = "qemu"
   end
   ```

   And similarly for the worker nodes:
   ```
   node.vm.provider "libvirt" do |libvirt|
     libvirt.cpus = settings["nodes"]["workers"]["cpu"]
     libvirt.memory = settings["nodes"]["workers"]["memory"]
     libvirt.machine_type = "pc"
     libvirt.driver = "qemu"
   end
   ```

---

### **Troubleshooting NFS Issues**

If you encounter an NFS-related error such as:

```
mount -o vers=3,udp 192.168.121.1:/path/to/vagrant /vagrant
mount.nfs: requested NFS version or transport protocol is not supported for /vagrant
```

To resolve this:

1. Edit `/etc/default/nfs-kernel-server` to disable NFS version 4:
   ```
   RPCMOUNTDOPTS="--manage-gids --no-nfs-version 4"
   ```

2. Restart the NFS server:
   ```
   sudo systemctl restart nfs-kernel-server
   ```

Try `vagrant up` again after these changes.

---

### **Provisioning the Virtual Machines**

1. **Bring Up the VMs**:
   ```
   vagrant up
   ```

2. **Check the Status of VMs**:
   ```
   vagrant status
   ```

3. **Connect to a VM**:
   Use SSH to connect:
   ```
   vagrant ssh controlplane
   ```

---

### **Connect to the Virtual Machines**

To access the VMs, use the `vagrant ssh` command:

1. **Connect to the Master Node**:  
   ```
   vagrant ssh controlplane
   ```
   
   Verify the connection by listing files:
   ```
   ls -la
   ```
   
2. **Exit the Node**:  
   Use the `logout` command to return to your local machine:
   ```
   logout
   ```

3. **Connect to the Worker Nodes**:  
   - **e.g. Worker Node 1**:  
   ```
   vagrant ssh node01
   ```
   
     Check uptime:
   ```
   uptime
   ```
   
     Exit when done:
   ```
   logout
   ```

---

### **Shutting Down and Restarting the Cluster**

To gracefully shut down all VMs:
```
vagrant halt
```

To restart them later:
```
vagrant up
```

---

In the next post, we will **bootstrap the Kubernetes cluster** using the **kubeadm** tool, and begin setting up the control plane components.