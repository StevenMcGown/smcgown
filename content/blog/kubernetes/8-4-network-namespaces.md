---
title: K8s 8.4 - Network Namespaces
date: 2024-06-16T07:07:07
summary: Detailed Guide & Introduction to Network Namespaces in Kubernetes
draft: true
---
In this post, we get introduced to network namespaces in Linux. Network namespaces are used by containers like Docker to implement network isolation.

Not to be confused with Kubernetes (K8s) namespaces, which are used to organize and manage resources within a Kubernetes cluster, Linux network namespaces provide network isolation at the system level, ensuring that each container or process operates in its own private network environment.
## Understanding Namespaces

Linux network namespaces are a feature that allows you to create isolated network environments within a single Linux kernel. This means that each container or process can have its own network stack, including unique IP addresses, routing tables, and network interfaces, all independent of each other.

We'll start with a simple host. Containers are separated from the underlying host using namespaces. Imagine your host is a large office building:

- Each namespace is like a private office within the building, assigned to different employees or teams.
- Each office has its own door and walls, providing privacy and separation.
- The people inside each office can only see and access what's inside their own office—they can't see or interact with other offices directly. To them, it feels like they are the only ones in the building.

![bdc94114-bf78-496b-8a7e-9ec0da5c3596.webp](/images/kubernetes/images/bdc94114-bf78-496b-8a7e-9ec0da5c3596.webp)

However, as the building manager, you have master keys and can see into all offices and manage them as needed. If necessary, you can also create connections between specific offices, allowing them to communicate directly.

## Creating and Managing Containers

When you create a container, you want to make sure that it is isolated, that it does not see any other processes on the host or any other containers. So we create a special room for it on our host using a namespace. As far as the container is concerned, it only sees the processes run by it and thinks that it is on its own host. 
- The underlying host, like the building manager in our analogy above, has visibility into all of the processes, including those running inside the containers. 
- The isolated processes can be seen when you list the processes from within the container: `$ ps aux`
![Pasted image 20240524161429.png](/images/kubernetes/images/Pasted-image-20240524161429.png)
You see a single process with a process ID of 1. 

When you list the same processes as a root user from the underlying host however, you see all the other processes, along with the process running inside the container, this time with a different process ID. 
- It's the same process running with different process IDs inside and outside the container. That's how namespaces work.

## Network Isolation

When it comes to networking, our host has its own interfaces that connect to the local area network (LAN), along with its own routing and ARP tables containing network information. 

![Network Namespaces](/images/kubernetes/diagrams/8-4-1-network-namespaces.png)

To isolate these details from the container, we create a network namespace for it when the container is created. This ensures that the container has no visibility into any network-related information on the host. 

![Network Namespaces](/images/kubernetes/diagrams/8-4-2-network-namespaces.png)

Within its namespace, the container can have its own virtual interfaces, as well as its own routing and ARP tables, completely independent of the host.

![Network Namespaces](/images/kubernetes/diagrams/8-4-3-network-namespaces.png)

## Creating a Network Namespace

To create a new network namespace on a Linux host, use the `$ ip netns add <namespace_name>` command. In this case, we create two network namespaces, one red and one blue. 
```
$ ip netns add red
$ ip netns add blue
```

![Network Namespaces](/images/kubernetes/diagrams/8-4-4-network-namespaces.png)

To list the network namespaces:
```
$ ip netns
```

To list the interfaces on my host:
```
$ ip link
```

When I check my host's network interfaces, I see two interfaces listed, the loopback interface and another interface identified as "80".
- The loopback interface is used for internal communication within the host, typically with the IP address `127.0.0.1`. 
- The "80" interface is an additional network interface that the host uses to connect to other networks, such as an Ethernet interface. This interface is only on the host; <mark>We should not see this interface when we view interfaces in the red/blue namespaces.</mark>

To view interfaces within a specific namespace, e.g. the red namespace, use:
```
$ ip netns exec red ip link
```

Equivalently, you can use:
```
$ ip -n red link
```

Both of these are the same. The second one is simpler, but remember this only works if you intend to run the `ip` command inside the namespace. 

When you run one of the two commands, only lists the loopback interface; you cannot see the 80 interface on the host. So with namespaces, we have successfully prevented the container from seeing the host interface. 
- The same is true with the ARP table. If you run the `arp` command on the host, you see a list of entries, but if you run it inside the container, you see no entries. 
- And the same for the routing table, using `$ ip netns exec red route`

## Establishing Connectivity Between Namespaces

As of now, these network namespaces have no network connectivity; they have no interfaces of their own and they cannot see the underlying host network. 

![Network Namespaces](/images/kubernetes/diagrams/8-4-4-network-namespaces.png)

Let's first look at establishing connectivity between the namespaces themselves. Just like how we would connect two physical machines together using a cable to an internet interface on each machine, you can connect two namespaces together using a virtual ethernet pair, or a virtual pipe. 
- To create the pipe, run the `ip link add` command with a type set to `veth` and specify the two ends `veth red` and `veth blue`. 
```
$ ip link add veth-red type veth peer name veth blue
```

![Network Namespaces](/images/kubernetes/diagrams/8-4-5-network-namespaces.png)

The next step is to attach each interface to the appropriate namespace. Use the command `$ ip link set veth-red netns red` to do that. 

![Network Namespaces](/images/kubernetes/diagrams/8-4-6-network-namespaces.png)

Similarly, attach the blue interface to the blue namespace using `$ ip link set veth-blue netns blue`. 

![Network Namespaces](/images/kubernetes/diagrams/8-4-7-network-namespaces.png)

We can then assign IP addresses to each of these namespaces. We will use the usual `ip addr` command to assign the IP address, but within each namespace.

```
$ ip -n red addr add 192.168.15.1 dev veth red
$ ip -n blue addr add 192.168.15.2 dev veth blue
```

We then bring up the interface using `ip link set <namespace> up` for each device within the respective namespaces. 

```
$ ip -n red link set veth-red up
$ ip -n blue link set veth-blue up
```

The links are up and the namespaces can now reach each other. Try a ping from the red namespace to reach the IP of the blue. 

`$ ip netns exec red ping 192.168.15.2`

![Network Namespaces](/images/kubernetes/diagrams/8-4-9-network-namespaces.png)

If you look at the ARP table on the red namespace, you see it's identified its blue neighbor at 192.168.15.2 with a MAC address. 

```
$ ip netns exec red arp
```

![Pasted image 20240525103027.png](/images/kubernetes/images/Pasted-image-20240525103027.png)

Similarly, if you list the ARP table on the blue namespace, you see it's identified its red neighbor. 

```
$ ip netns exec blue arp
```

![Pasted image 20240525103109.png](/images/kubernetes/images/Pasted-image-20240525103109.png)

If you compare this with the ARP table of the host, you see that the host ARP table has no idea about these new namespaces we have created, and no idea about the interfaces we created in them.

## Connecting Multiple Namespaces

Now, that worked when you had just two namespaces. What do you do when you have more of them? How do you enable all of them to communicate with each other? Just like in the physical world, you create a virtual network inside your host. Create a network, you need a switch, so to create a virtual network, you need a virtual switch. So you create a virtual switch within our host, and connect the namespaces to it. But how do you create a virtual switch within a host? There are multiple solutions available, such as the native solution, called as Linux bridge, and the Open vSwitch, etc. In this example, we will use the Linux bridge option. To create an internal bridge network, we add a new interface to the host using the `ip link add` command with the type set to bridge. We will name is Vnet0. As far as our host is concerned, it is just another interface, just like the 80 interface. It appears in the output of the `ip link` command along with the other interfaces. It's currently down, so you need to turn it up. Use `ip link set up` command to bring it up.

## Connecting Namespaces to the Virtual Switch

Now, for the namespaces, this interface is like a switch that it can connect to. So think of it as an interface for the host and a switch for the namespaces. So the next step is to connect the namespaces to this new virtual network switch. Earlier, we created the cable, or the eth pair with the v8 red interface on one end and blue interface on the other because we wanted to connect the two namespaces directly. Now, we will be connecting all namespaces to the bridge network. So we need new cables for that purpose. This cable doesn't make sense anymore so we will get rid of it. Use the `ip link delete` command to delete the cable. When you delete the link with one end the other end gets deleted automatically since they are a pair. Let us now create new cables to connect the namespaces to the bridge. Run the `ip link add` command and create a pair with v8 red on one end, like before, but this time the other end will be named V8 red VR as it connects to the bridge network. This naming convention will help us easily identify the interfaces that associate to the red namespace. Similarly, create a cable to connect the blue namespace to the bridge network. Now that we have the cables ready, it's time to get them connected to the namespaces. To attach one end of this, of the interface, to the red namespace, run the `ip link set v8 red netns red` command. To attach the other end to the bridge network, run the `ip link set` command on the v8 red VR end and specify the master for it as the VNET zero network. Follow the same procedure to attach the blue cable to the blue namespace and the bridge network. Let us now set IP addresses for these links and turn them up. We will use the same IP addresses that we used before, 192.168.15.1 and 192.168.15.2. And finally turn the devices up. The containers can now reach each other over the network. So we follow the same procedure to connect the remaining two namespaces to the same network. We now have all four namespaces connected to our internal bridge network and they can all communicate with each other. They have all IP addresses, 192.168.15.1, 2, 3, and 4.

## Establishing Connectivity Between Host and Namespaces

And remember, we assigned our host the IP 192.168.1.2. From my host, what if I tried to reach one of these interfaces in these namespaces? Will it work? No. My host is on one network and the namespaces are on another. But what if I really want to establish connectivity between my host and these namespaces? Remember we said that the virtual switch is actually a network interface for the host. So we do have an interface on the 192.168.15 network on our host. Since this just another interface all we need to do is assign an IP address to it so we can reach the

 namespaces through it. Run the `ip addr` command to set the IP 192.168.15.5 to this interface. We can now ping the red namespace from our local host. Now remember, this entire network is still private and restricted within the host. From within the namespaces, you can't reach the outside world nor can anyone from the outside world reach the services or applications hosted inside. The only door to the outside world is the ethernet port on the host.

## Configuring Bridge for LAN Connectivity

So how do we configure this bridge to reach the LAN network through the ethernet port? Say there is another host attached to our LAN network with the address 192.168.1.3. How can I reach this host from within my namespaces? What happens if I try to ping this host from my namespace? The blue namespace sees that I'm trying to reach a network at 192.168.1, which is different from my current network of 192.168.15. So it looks at its routing table to see how to find that network. The routing table has no information about other network. So it comes back saying that the network is unreachable. So we need to add an entry into the routing table to provide a gateway or door to the outside world. So how do we find that gateway? A door or a gateway, as we discussed before, is a system on the local network that connects to the other network. So what is a system that has one interface on the network local to the blue namespace which is the 192.168.15 network and is also connected to the outside LAN network? Here's a logical view. It's the local host that have all these namespaces on so you can ping the namespaces. Remember, our local host has an interface to attach the private network so you can ping the namespaces. So our local host is the gateway that connects the two networks together. We can now add a row entry in the blue namespace to say route all traffic to the 192.168.1 network through the gateway at 192.168.15.5.

## Configuring Default Gateway

Now remember, our host has two IP addresses; one on the bridge network at 1925.168.15.5 and another on the external network at 192.168.1.2. Can you use any in the route? No, because the blue namespace can only reach the gateway in its local network at 192.168.15.5. The default gateway should be reachable from your namespace when you add it to your route. When you try to ping now, you no longer get the network unreachable message, but you still don't get any response back from the ping. What might be the problem? We talked about a similar situation in one of our earlier lectures where, from our home network, we tried to reach the external internet through our router. Our home network has our internal private IP addresses that the destination network don't know about so they cannot reach back. For this, we need NAT enable on our host acting as a gateway here so that it can send the messages to the LAN in its own name with its own address.

## Enabling NAT Functionality

So how do we add NAT functionality to our host? You should do that using IP tables. Add a new rule in the NAT IP table in the post routing chain to masquerade or replace the from address on all packets coming from the source network 192.168.15.0 with its own IP address. That way, anyone receiving these packets outside the network will think that they're coming from the host and not from within the namespaces. When we try to ping now, we see that we are able to reach the outside world.

## Reaching the Internet from Namespaces

Finally, say the LAN is connected to the internet. We want the namespaces to reach the internet. So we try to ping a server on the internet at 8.8.8.8 from the blue namespace. We receive a similar message that the network is unreachable. By now we know why that is. We look at the routing table and see that we have routes to the network, 192.168.1, but not to anything else. Since these namespaces can reach any network our host can reach, we can simply say that, to reach any external network, talk to our host. So we add a default gateway specifying our host. We should now be able to reach the outside world from within these namespaces.

## Connectivity from Outside World to Namespaces

Now, what about connectivity from the outside world to inside the namespaces? Say for example, the blue namespace hosts a web application on Port 80. As of now, the namespaces are on an internal private network and no one from the outside world knows about them. You can only access these from the host itself. If you try to ping the private IP of the namespace from another host on another network, you will see that it's not reachable, obviously, because that host doesn't know about this private network. In order to make that communication possible you have two options. The two options that we saw in the previous lecture on that. The first is to give away the identity of the private network to the second host. So we basically add an IP route entry to the second host telling the host that the network 192.168.15 can be reached through the host at 192.168.1.2. But we don't want to do that. The other option is to add a port forwarding role using IP tables to say any traffic coming to Port 80 on the local host is to be forwarded to port 80 on the IP assigned to the blue namespace.