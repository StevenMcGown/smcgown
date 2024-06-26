---
title: K8s 4.4 - Configuring Secrets
date: 2024-05-10T07:07:07
summary: A comprehensive guide on configuring Secrets in Kubernetes
type: "blog"
---
Here we have a simple Python web application that connects to MySQL database. On success, the application displays a successful message. 

app.py
```
import os
from flask import Flask

app = Flask(__name__)

@app.route("/")
def main ():

mysql.connector.connect (host='mysql', database='mysql',
user='root', password='p@ssw0rd')

return render_template('hello.html', color=fetchcolor())

if __name__ == "__main__"
	app.run(host="0.0.0.0", port="8080")
```
If you look closely into the code, you will see the host name, username, and password are hard coded, which of course not a good idea.

As we learn in the previous lecture, one option would be to move these values into a ConfigMap. However, ConfigMap stores configuration data in plain text format. 
- So while it would be okay to move the host name and username into a config map, it is definitely not the right place to store a password. This is where **secrets** come in.

---
# Creating a Secret

**Secrets** are used to store sensitive information like passwords or keys. They're similar to ConfigMaps except that they're stored in an encoded format, i.e. the data is converted into a format that is not human-readable. As with ConfigMaps, there are two steps involved in working with secrets. 
- First, create the secret. Second, inject it into the pod.

There are two ways of creating a secret.

1) The **imperative** way, without using a secret definition file. 
- With the imperative method, you can directly specify the key value pairs in the command line itself. 
- To create a secret of the given values, run: 
```
$ kubectl create secret generic \
	<secret-name> --from-literal=<key>=<value>

$ kubectl create secret generic \
	app-secret --from-literal=DB_Host=mysql \
				--from-literal=DB_User=root \
				--from-literal=DB_Password=p@ssw0rd
``` 
- The `--from-literal` option is used to specify the key value pairs in the command itself.
- If you wish to add additional key value pairs, simply specify the from literal options multiple times. However, this could get complicated when you have too many secrets to pass in.

Another way to input the secret data is through a file. 
- Use the `--from-file` option to specify a path to the file that contains the required data. The data from this file is read and stored under the name of the file.

app_secret
```
DB_HOST: mysql
DB_User: root
DB_Paswword: p@ssw0rd
```

```
$ kubectl create secret generic \
	app-secret --from-file=app_secret.properties
```

2) The **declarative** way, by using a secret definition file. 
- For this, we create a definition file, just like how we did for the ConfigMap, and use the same app_secret from before. 
app_secret
```
DB_HOST: mysql
DB_User: root
DB_Password: p@ssw0rd
```

secret-data.yaml
```
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
data:
  DB_HOST: mysql
  DB_User: root
  DB_Password: p@ssw0rd
```

 - However, one thing we discussed about secrets was that they're used to store sensitive data and are stored in an encoded format. Here we have specified the data in plain text which is not very safe.
 - So <mark>while creating a secret with a declarative approach, you must specify the secret values in an encoded format</mark>. 
 - But how do you convert the data from plain text to an encoded format? On a Linux host, run the command echo-n, followed by the text you're trying to convert which is my SQL in this case. And pipe that to the base 64 utility.
```
echo -n 'mysql' | base64
# Output: bXlzcWw=

echo -n 'root' | base64
# Output: cm9vdA==

echo -n 'p@ssw0rd' | base64
# Output: cEAzc3cwcmQ=

```
- You can use these encoded secrets in the secret definition file and create the secret with: `$ kubectl create -f secret-data.yaml`
---
# Viewing Secrets

To view secrets, run the `$ kubectl get secrets` command. 
- This lists the newly created secret along with another secret previously created by Kubernetes for its internal purposes. 

To view more information on the newly created secret run the `$ kubectl describe secret `command. 
- This shows the attributes in the secret but hides the value themselves. 

To view the values as well, run the `$ kubectl get secret` command with the output displayed in a YAML format. Using the `-o yaml` option. You can now see the hand coded values as well.

Now, how do you decode encoded values? Use the same base 64 command used earlier to encode it but this time add a decode option to it. 
```
echo -n 'bXlzcWw=' | base64 --decode
# Output: mysql

echo -n 'cm9vdA==' | base64 --decode
# Output: root

echo -n 'cEAzc3cwcmQ=' | base64 --decode
# Output: p@ssw0rd

```

---
# Configuring the Secret with a Pod

Now that we have secret created let us proceed with step two, configuring it with a pod. Here is a simple pod definition file that runs an application. 

secret-data.yaml
```
apiVersion: v1
kind: Secret
metadata:
  name: app-secret # This is what connects the Secret to the pod
data: 
  DB_Host=bXlzcWw= 
  DB_User=cm9vdA==
  DB_Password=cEAzc3cwcmQ=
  
```

pod-definition.yaml
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
    envFrom:
    - secretRef:
        name: app-secret # This is what connects the Secret to the pod
```

To inject an environment variable add a new property to the  container called `envFrom`. 
- This property is a list so we can pass as many environment variables as required. Each item in the list corresponds to a secret item.
- Specify the name of the secret we created earlier. Creating the pod definition file now makes the data in the secret available as environment variables for the application.

What we just saw was injecting secrets as environment variables into the pods. Again, this was the relevant YAML for injecting environment variables:
```
    envFrom:
    - secretRef:
        name: app-secret # This is what connects the Secret to the pod
```

There are other ways to inject secrets into pods. 
- You can inject as single environment variables
```
env:
  - name
    valueFrom:
      secretKeyRef:
        name: app-secret
        key: DB_Password
```
- You can inject the whole secret as files in a volume.
```
volumes:
- name: app-secret-volume
  secret:
    secretName: app-secret
```
- If you were to mount the secret as a volume in the pod. <mark>Each attribute in the secret is created as a file with the value of the secret as its content.</mark> 
- In this case, since we have three attributes in our secret three files are created, and if we look at the contents of the DB_Password file, we see the password in it.
---
# Important Things to Note About Secrets

Note that secrets are not encrypted. They're only encoded, meaning anyone can look up the file that you created for secrets or get the secret object and then decode it using the methods that we discussed before to see the confidential data. 
- Remember not to check in your secret definition files along with your code when you push to GitHub or something. 
- There are a lot of lots of repositories already on GitHub where users have pushed their secret objects along with their code, the rest of the code. You could easily get those secret objects read them, and then just decode them using the basic 64 option that we just discussed, and you can get to see the what the underlying passwords are.

Another note is that the secrets are not encrypted in ETCD, so none of the data in ETCD is encrypted by default, so consider enabling encryption at rest. 
- This document talks about encrypting secret data at rest: https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/
- This will be explained in greater detail later

Also note that <mark>anyone able to create pods or deployments in the same name space can access the secrets as well</mark>. 
- Once you create a secret in a particular name space if anyone with access to creating a pod or deployment in the same name space just goes in and creates a pod or deployment and uses that same secret, then they're able to see the secret objects mounted onto those pods. 
- Consider configuring role-based access control to restrict access. 
 
Finally, consider third party secret provider, such as AWS provider or Azure provider or GCP provider or the <mark>Vault provider</mark>. This way, the secrets are stored not in ETCD but in external secret provider, and that those providers take care of most of the security.

# How Secrets are Stored in ETCD

We want to ensure that data is encrypted when written to etcd by enabling <mark>encryption at rest</mark>, i.e. after restarting your `kube-apiserver`, any newly created or updated Secret (or other resource kinds configured in `EncryptionConfiguration`) should be encrypted when stored.

This next section uses the `etcdctl` tool. If you don't have it, run `$ apt-get install etcd-client` . Check the version with `$ etcdctl version`, and just remember that's the client only, the server is still running on as a pod. 
- You will see that the server is running on a pod if you run `$ kubectl get pods -n kube-system`.  
- Next, check if you have a certificate file with `$ ls /etc/kubernetes/pki/etcd/` and you should see all of the certificate file for authenticating to the ETCD server. 


## Create a Secret

Let's take the following secret...
```
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
data:
  key1: supersecret
```
And run the following with `etcdctl`, remembering to set the version to 3. 
```
ETCDCTL_API=3 etcdctl \ *
-- cacert=/etc/kubernetes/pki/etcd/ca.crt
-- cert=/etc/kubernetes/pki/etcd/server.crt \
-- key=/etc/kubernetes/pki/etcd/server.key
get /registry/secrets/default/my-secret | hexdump -C
```
- The output is similar to this. You see, however, the secret "supersecret" is still visible in plain text, therefore it is not encrypted.
```
00000000  2f 72 65 67 69 73 74 72  79 2f 73 65 63 72 65 74  |/registry/secret| 
00000010  73 2f 64 65 66 61 75 6c  74 2f 6d 79 2d 73 65 63  |s/default/my-sec|
00000020  72 65 74 0a 6b 38 73 00  0a 0c 0a 02 76 31 12 06  |ret.k8s.....v1..|
00000030  53 65 63 72 65 74 12 d0  01 0a b0 01 0a 09 6d 79  |Secret........my| 
00000040  2d 73 65 63 72 65 74 12  00 1a 07 64 65 66 61 75  |-secret....defau| 
00000050  6c 74 22 00 2a 24 64 66  65 39 37 63 36 32 2d 35  |lt".*$dfe97c62-5|
00000060  61 61 31 2d 34 36 61 38  2d 62 37 31 63 2d 66 66  |aa1-46a8-b71c-ff|
00000070  61 30 63 64 34 63 30 38  65 63 32 00 38 00 42 08  |a0cd4c08ec2.8.B.|
00000080  08 d5 c7 d8 9a 06 10 00  8a 01 61 0a 0e 6b 75 62  |..........a..kub|
00000090  65 63 74 6c 2d 63 72 65  61 74 65 12 06 55 70 64  |ectl-create..Upd|
000000a0  61 74 65 1a 02 76 31 22  08 08 d5 c7 d8 9a 06 10  |ate..v1"........|
000000b0  00 32 08 46 69 65 6c 64  73 56 31 3a 2d 0a 2b 7b  |.2.FieldsV1:-.+{|
000000c0  22 66 3a 64 61 74 61 22  3a 7b 22 2e 22 3a 7b 7d  |"f:data":{".":{}| 
000000d0  2c 22 66 3a 6b 65 79 31  22 3a 7b 7d 7d 2c 22 66  |,"f:key1":{}},"f|
000000e0  3a 74 79 70 65 22 3a 7b  7d 7d 42 00 12 13 0a 04  |:type":{}}B.....| 
000000f0  6b 65 79 31 12 0b 73 75  70 65 72 73 65 63 72 65  |key1..supersecre|
00000100  74 1a 06 4f 70 61 71 75  65 1a 00 22 00 0a        |t..Opaque.."..| 
0000010e
```

First step to mitigating this is to determine if encryption address is already enabled or not. 
- This is done with a property called `--encryption-provider-config` in the [[KubeAPIServer]]. We can see what options the Kube API Server is running with by listing the processes , grepping for 'kube-api' and then 'encryption-provider-config': `$ ps -aux | grep kube-api | encryption-provider-config`

In this example, it does not return a result, therefore it is not configured. This can also be verified in kubeadm setups if you look at this particular file:
`$ cat /etc/kubernetes/manifests/kube-apiserver.yaml`
- Again in this example, this option is not listed here, which means that encryption at rest is not enabled. 

## Create a Configuration File
The next step is to create a configuration file and then pass in the `--encryption-provider-config` option. The following configuration file is an example from the k8s documentation and should not be used at face value in your cluster.

```
---
#
# CAUTION: this is an example configuration.
#          Do not use this for your own cluster!
#
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  - configmaps
  - pandas.awesome.bears.example # a custom resource API
  providers:
  - identity: {} # plain text, in other words NO encryption
  - aesgcm:
      keys:
      - name: key1
        secret: c2VjcmV0IGlzIHNlY3VyZQ==
      - name: key2
        secret: dGhpcyBpcyBwYXNzd29yZA==
  - aescbc:
      keys:
      - name: key1
        secret: c2VjcmV0IGlzIHNlY3VyZQ==
      - name: key2
        secret: dGhpcyBpcyBwYXNzd29yZA==
  - secretbox:
      keys:
      - name: key1
        secret: YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=
- resources:
  - events
  providers:
  - identity: {} # do not encrypt Events even though *.* is specified below
- resources:
  - '*.apps' # wildcard match requires Kubernetes 1.27 or later
  providers:
  - aescbc:
      keys:
      - name: key2
        secret: c2VjcmV0IGlzIHNlY3VyZSwgb3IgaXMgaXQ/Cg==
- resources:
  - '*.*' # wildcard match requires Kubernetes 1.27 or later
  providers:
  - aescbc:
      keys:
      - name: key3
        secret: c2VjcmV0IGlzIHNlY3VyZSwgSSB0aGluaw==
```

You can pick and choose which resources you want to encrypt; you may have pods and deployments and secrets and services. Whatever the case, you want to store all of your secrets as encrypted. 
- You might not want to encrypt everything because not everything is confidential, though, so you need not necessarily encrypt and save all the data about pods and deployments. 

Under resources, you specify the targets, in our case the targets are:
- secrets
- configmaps
- pandas.awesome.bears.example (a custom resource API)

You can encrypt something using a set of providers, and the default one is called identity. However, the <mark>identity provider just means that there's no encryption at all</mark>, so resources are written as is without any encryption. 
- The other providers are used for encryption, e.g. aesgcm, aescbc. secret box, etc.
- You can see the details about how they encrypt here: https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/#providers
- You can choose whichever one you want and provide a key and a secret, or even provide multiple keys and secrets. 

One thing to note here is the order of the items in the providers list. This order matters because whatever the first one is will be what's going to be used for encryption.
- This means that since `identity` is the first one listed, there will be no encryption.

# Create a Simple EncryptionConfiguration

Let's create a much simpler version of this file using AES CBC as the first one which will be used for encryption. This requires a secret object to be used as an encryption key, so we can generate a 32 by random key using: 
`$ head -c 32 /dev/urandom | base64`

Now we can use this random key in the `secret` field under the `keys` attribute in the new file:

enc.yaml
```
---
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
      - configmaps
      - pandas.awesome.bears.example
    providers:
      - aescbc:
          keys:
            - name: key1
              # See the following text for more details about the secret value
              secret: y0xTt+U6xgRdNxe4nDYYsij0GgRDoUYC+WAwOKeNfPs= # base 64 encoded secret
      - identity: {} # this fallback allows reading unencrypted secrets;
                     # for example, during initial migration
```

Now that the encryption configuration has been established, we can reference the configuration in the kube-api-server.yaml file which was established by kubeadm at the location`/etc/kubernetes/manifests/kube-apiserver.yaml`.  
- Essentially what we're doing here is establishing the encryption method defined in enc.yaml, and mounting that local definition to the Kube API server's corresponding directory. This is what the file may look like:

kube-api-server.yaml
```
---
#
# This is a fragment of a manifest for a static Pod.
# Check whether this is correct for your cluster and for your API server.
#
apiVersion: v1
kind: Pod
metadata:
  annotations:
    kubeadm.kubernetes.io/kube-apiserver.advertise-address.endpoint: 10.20.30.40:443
  creationTimestamp: null
  labels:
    app.kubernetes.io/component: kube-apiserver
    tier: control-plane
  name: kube-apiserver
  namespace: kube-system
spec:
  containers:
  - command:
    - kube-apiserver
    ...
    - --encryption-provider-config=/etc/kubernetes/enc/enc.yaml  # add this line
    volumeMounts:
    ...
    - name: enc                           # add this line
      mountPath: /etc/kubernetes/enc      # add this line
      readOnly: true                      # add this line
    ...
  volumes:
  ...
  - name: enc                             # add this line
    hostPath:                             # add this line
      path: /etc/kubernetes/enc           # add this line
      type: DirectoryOrCreate             # add this line
  ...
```

In the Kube API server, add the file path to the `--encryption-provider-config` option. Since the file is created locally, it has to be **mounted** as a volume like we saw before in [[2.10 - Multiple Schedulers]] and [[4.3 - Configuring ConfigMaps]]. 

Two more things to note are the mountPath and the hostPath. You can see that both are located at `/etc/kubernetes/enc `
- `hostPath`: Specifies a directory on the **host machine** (`path: /etc/kubernetes/enc`) that will be mounted into the Pod.
- `mountPath`: Specifies the path within the container **where the volume will be mounted.**  Here, it's `/etc/kubernetes/enc`.

Having the same path specified for both `mountPath` and `hostPath` indicates that you're essentially mounting a directory from the host machine directly into the container at the same location. This configuration is useful when you want to make host machine files or directories accessible within the container.
- If you haven't created this path locally, you must create the path and ensure that the local file is in the directory you've specified for the hostPath.  This way anything that's available locally in the hostPath is going to be available in the mountPath.
```
mkdir /etc/kubernetes/enc
mv enc.yaml /etc/kubernetes/enc/
ls /etc/kubernetes/enc
```

After making these changes, the Kube API server should restart. You can run `$ crictl pods` to check on the status of the Kube API Server deployment. Once you confirm it is running you can again run `$ ps aux | grep kube-api | grep  encryption-provider-config` to confirm the Kube API server is now running with the `--encryption-provider-config` option.

# Create Another Secrets File
Let's create another secrets object. Secrets are <mark>now created with encryption was enabled</mark>.
`$ kubectl create secret generic my-secret-2 --from-literal=key2=topsecret`

View the secret using `$ k get secret`

Run this command again, except this time for the secret we just created, **my-secret-2**.
```
ETCDCTL_API=3 etcdctl \ *
-- cacert=/etc/kubernetes/pki/etcd/ca.crt
-- cert=/etc/kubernetes/pki/etcd/server.crt \
-- key=/etc/kubernetes/pki/etcd/server.key
get /registry/secrets/default/my-secret-2 | hexdump -C
```
- This time when you append the `| hexdump -C` bit at the end, the output will be encrypted, and therefore the secret that we specified before, "topsecret" will not be able to be seen in plaintext.
- We can confirm that encryption is working, but if you dump the previous one, you will still see the secret because <mark>after encryption is enabled, only things that you create newly will be encrypted. </mark>

However, if you update an existing configuration, then that will be re-encrypted. So essentially what you must do is update the old secret objects with the same data. An easy command for this is: `$ kubectl get secrets --all-namespaces -o json | kubectl replace -f -`

And that's it for encrypting secrets at REST!