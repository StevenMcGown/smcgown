---
title: K8s 8.2 - DNS in K8s
date: 2024-06-14T07:07:07
summary: Understanding and Configuring DNS in Kubernetes
type: "blog"
---
In this post, we get introduced to DNS in Linux for absolute beginners. We will discuss the basic concepts and view some commands that will help us explore DNS configuration on hosts, specifically Linux hosts. 

### DNS Configuration on Hosts

We have two computers, A and B, both part of the same network, and they've been assigned IP addresses `192.168.1.10` and `192.168.1.11` respectively. You can ping one computer from the other using the IP address. However, remembering IP addresses can be cumbersome, especially if you know that system B has database services. To make things easier, you can assign a name, `db`, to system B.

![DNS](/images/kubernetes/diagrams/8-2-1-dns.png)

If you try to ping `db` now, system A won't recognize it because it doesn't know that `db` corresponds to `192.168.1.11`. To fix this, you need to tell system A that `192.168.1.11` should be referred to as `db`. You can do this by adding an entry in the `/etc/hosts` file on system A. This file is used for local hostname resolution:

/etc/hosts
```
192.168.1.11 db
```

By editing the `/etc/hosts` file, you've told system A that `192.168.1.11` is called `db`. Now, pings to `db` will be successful. It's important to note that the `/etc/hosts` file is the source of truth for hostname resolution on the local system, but it doesn't verify if the actual hostname of system B is `db`. 
- For instance, the hostname of system B could still be `host-2`, but system A doesn't care; it goes by what's in the `/etc/hosts` file.

You can even trick system A into believing that system B is Google by adding an entry in the `/etc/hosts` file:

/etc/hosts
```
192.168.1.11 www.google.com
```

Pinging Google would then result in a response from system B.

### Name Resolution with DNS

While the `/etc/hosts` file works well in small networks, it becomes unmanageable in larger environments. Each time a server's IP changes, you would need to update the `/etc/hosts` file on every system. 

/etc/hosts
```
192.168.1.10 webserver 
192.168.1.11 database 
192.168.1.12 fileserver 
192.168.1.13 mailserver 
192.168.1.14 appserver 
192.168.1.15 backupserver 
192.168.1.16 proxyserver 
192.168.1.17 testserver
```

![DNS](/images/kubernetes/diagrams/8-2-2-dns.png)

This led to the development of the DNS server, which centralizes hostname-to-IP resolution. Instead of relying on local `/etc/hosts` files, all hosts are configured to query the DNS server for hostname resolution.

![DNS](/images/kubernetes/diagrams/8-2-3-dns.png)

To configure a system to use a DNS server, you edit the `/etc/resolv.conf` file and add the DNS server's IP address:

/etc/resolv.conf
```
nameserver 192.168.1.100
```

Now, when a system encounters a hostname it doesn't recognize, it queries the DNS server.

### Managing DNS Entries

When a DNS server is used, changes to IP addresses only need to be updated on the DNS server, and all systems will resolve the new IP addresses accordingly. 

However, local `/etc/hosts` entries can still be used for specific purposes, such as testing. 
- For example, if you provision a test server which others do not need to be able to resolve using DNS, you can edit `/etc/hosts` on to include the test server
```
192.168.1.10 web
192.168.1.11 db
192.168.1.12 file
192.168.1.13 mail
192.168.1.14 app
192.168.1.15 backup
192.168.1.16 proxy 
192.168.1.17 sql

192.168.1.116 test
```

If a hostname exists in both the `/etc/hosts` file and the DNS server, the system will check the `/etc/hosts` file first, as defined by the `/etc/nsswitch.conf` file:

/etc/nsswitch.conf
```
hosts: files dns
```

This order can be changed by editing the `/etc/nsswitch.conf` file.

### Domain Names and DNS Records

When you ping an external site like `www.facebook.com`, your request goes to a public DNS server, such as Google's public DNS server at `8.8.8.8`. You can configure multiple name servers in the `/etc/resolv.conf` file, and your internal DNS server can be set to forward unknown hostnames to a public DNS server.

```
192.168.1.10 web
192.168.1.11 db
192.168.1.12 file
192.168.1.13 mail
192.168.1.14 app
192.168.1.15 backup
192.168.1.16 proxy 
192.168.1.17 sql

192.168.1.116 test

Forward All to 8.8.8.8
```

Domain names like `www.google.com` follow a hierarchical structure with top-level domains (TLDs) like `.com`, `.net`, `.edu`, etc. This structure helps in organizing and resolving domain names. 
- For example, `www.google.com` can have subdomains like `maps.google.com`, `drive.google.com`, etc.

In Google's case, the dot (.) is the root of the DNS hierarchy. Everything starts from this root. The next part, `.com`, is a top-level domain (TLD), representing commercial or general-purpose domains. The part `google` is the domain name assigned to Google, and `www` is a subdomain. Subdomains help organize and group services under Google.

For example:
- Google's map service is available at `maps.google.com` (subdomain: maps).
- Google's storage service is available at `drive.google.com` (subdomain: drive).
- Google's mobile apps are available at `apps.google.com` (subdomain: apps).
- Google's email service is available at `mail.google.com` (subdomain: mail).

![DNS](/images/kubernetes/diagrams/8-2-4-dns.png)

Each of these services can have further subdomains, creating a tree structure. When you try to reach any of these domain names, say `apps.google.com`, your request first hits your organization's internal DNS server. If it doesn't know the address, it forwards your request to the internet.

On the internet, multiple DNS servers help resolve the IP address:
1. A root DNS server points you to a DNS server for `.com` domains.
2. The `.com` DNS server forwards your request to Google's DNS server.
3. Google's DNS server provides the IP address for `apps.google.com`.

To speed up future queries, your organization's DNS server may cache this IP for a period of time, typically a few seconds to a few minutes, avoiding the need to resolve the address again.

### Internal DNS Structure

Your organization can have a similar structure. For example, if your organization is called `mycompany.com`, it can have multiple subdomains for different purposes:

![DNS](/images/kubernetes/diagrams/8-2-5-dns.png)

- `www.mycompany.com` for the external website.
- `mail.mycompany.com` for accessing organizational email.
- `drive.mycompany.com` for accessing storage.
- `pay.mycompany.com` for accessing the payroll application.
- `hr.mycompany.com` for accessing the HR application.

All these subdomains are configured in your organization's internal DNS server.
### Configuring DNS Resolution

The reason we discussed this is to understand the `search` entry in the `/etc/resolv.conf` file, which again is used to configure the DNS server for a host.

Now, let's say you've introduced domain names like `web.mycompany.com` or `db.mycompany.com`. When you ping the old name `web`, it won't resolve because there's no record for `web` alone on the DNS server. Instead, you need to ping `web.mycompany.com`.

To make it easier to use short names within your organization, you can use the `search` entry in the `/etc/resolv.conf` file:

```
search mycompany.com
```

This way, when you ping `web`, your host appends `mycompany.com`, trying `web.mycompany.com`. You can also add additional search domains:

```
search mycompany.com prod.mycompany.com
```

### DNS Record Types

DNS servers store various types of records:
- **A Records**: Maps a hostname to an IPv4 address.
- **AAAA Records**: Maps a hostname to an IPv6 address.
- **CNAME Records**: Maps one hostname to another hostname (alias)

| Record Type | Description                              | Example                       |
|-------------|------------------------------------------|-------------------------------|
| **A Record**   | Maps a hostname to an IPv4 address.       | `example.com -> 192.168.1.1`  |
| **AAAA Record**| Maps a hostname to an IPv6 address.       | `example.com -> 2001:db8::1`  |
| **CNAME Record**| Maps one hostname to another hostname (alias). | `www.example.com -> example.com` |
### Tools for DNS Resolution

- **ping**: Simple tool to test connectivity and DNS resolution.
- **nslookup**: Queries DNS servers for hostname resolution but doesn't consider local `/etc/hosts` entries.
- **dig**: Similar to `nslookup`, but provides more detailed information about DNS queries and responses.