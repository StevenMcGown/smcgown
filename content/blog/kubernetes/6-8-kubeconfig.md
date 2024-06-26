---
title: K8s 6.8  Kubeconfig
date: 2024-05-26T07:07:07
summary: Deep Dive into Kubeconfig in Kubernetes Administration
type: "blog"
---
So far, we have seen how to generate a certificate for a user. You've seen how a client uses the certificate file and key to query the Kubernetes REST API for a list of pods using cURL. In this case, my cluster is called "kube-test-server", so I send a cURL request to the address of the kube-apiserver while passing in the bearer files, along with the CA certificate as options. This is then validated by the API server to authenticate the user.

```ell
curl https://kube-test-server:6443/api/v1/pods \
  --key admin.key
  --cert admin.crt
  --cacert ca.crt
```

Hypothetically, this would return something of the sort:
```
{
	"kind": "PodList",
	"apiVersion": "v1",
	"metadata": {
		"selfLink": "api/v1/pods",
	},
	items: []
}
```
## Using Kubectl with Kubeconfigs

Using kubectl, you can get that information by specifying the same information using the options server, client key, client certificate, and certificate authority. 

```
kubectl get pods
  --server kube-test-server:6443
  --client-key admin.key
  --client-certificate admin.crt
  --certificate-authority ca.crt
```

Typing those options in every time is a tedious task, so you can move this information to a **KubeConfig** file and then specify this file as the kubeconfig option in your command. 


config
```
  --server kube-test-server:6443
  --client-key admin.key
  --client-certificate admin.crt
  --certificate-authority ca.crt
```

By default, the kubectl tool looks for a file named config under a user's home directory `$HOME/.kube/config`. So if you create the KubeConfig file there, you don't have to specify the path to the file explicitly in the kubectl command. This is why you haven't been specifying any options for your kubectl commands so far.

## Understanding the Kubeconfig File Structure

The config file has three sections: clusters, users, and contexts. 
1) Clusters are the various Kubernetes clusters that you need access to. For example, say you have multiple clusters for development environment or testing environment or prod or for different organizations or on different cloud providers, et cetera. All those go there. 
2) Users are the user accounts with which you have access to these clusters. For example, the admin user, a dev user, a prod user, et cetera. These users may have different privileges on different clusters. 
3) Finally, contexts marry these together. Contexts define which user account will be used to access which cluster. For example, you could create a context named admin at production that will use the admin account to access a production cluster. Or I may want to access the cluster I have set up on AWS with the dev user's credentials to test deploying the application I built.
![Kube config](/images/kubernetes/diagrams/6-8-1-kubeconfig.png)

Remember, you're not creating any new users or configuring any kind of user access or authorization in the cluster with this process. You're using **existing users** with their **existing privileges** and defining what user you're going to use to access what cluster. That way you don't have to specify the user certificates and server address in each and every kubectl command you run. 

So how does it fit into our example? The **server specifications** in our command goes into the cluster section. The admin **user's keys** and **certificates** goes into the **user section**. 

![Kube config](/images/kubernetes/diagrams/6-8-2-kubeconfig.png)

You then create a context that specifies to use the my kube admin user to access the my kube playground cluster. 
## YAML Structure of Kubeconfig

kubeconfig.yaml
```
apiVersion: v1
kind: Config
clusters:
- name: kube-test-server
  cluster:
    certificate-authority: ca.crt
    server: https:kube-test-server:6443
- name: development
    ...
- name: production
    ...
- name: aws
    ...

contexts:
- name: kube-admin@kube-test-server
  context:
    cluster: kube-test-server
    user: kube-admin
    
users:
- name: kube-admin 
  user:
    client-certificate: admin.crt
    client-key: admin.key
```
Here in the yaml, we can see the three sections as we discussed: clusters, contexts and users, each in an array format. That way you can specify multiple clusters, users or contexts within the same file. 
- Under clusters, we add a new item for the kube-test-server cluster and specify the server address under the server field. It also requires the certificate of the certificate authority. 
- We can then add an entry into the user's section to specify details of the kube-admin user, such as the location of the client certificate and key pair
- Next, we create an entry under the context section to link the two together. We will name the context **kube-admin@kube-test-server.** We will then specify the same name we used for cluster and user. 
- Follow the same procedure to add all the clusters you daily access, the user credentials you use to access them, as well as the context. 

Once the file is ready, remember, you don't have to create any object, like you usually do for other Kubernetes objects. The file is left as is and is read by the kubectl command and the required values are used.

## Managing Contexts and Namespaces

But how does kubectl know which context to choose from? We've defined three contexts here, which one should it start with? You can specify the default context used by adding a field current context to the KubeConfig file, specifying the name of the context to use. 

kubeconfig.yaml
```
apiVersion: v1
kind: Config
current-context: dev-user@aws 
...
```

In this case, kubectl will always uses the context **dev-user@aws** to access the AWS clusters using the dev user's credentials. 

There are also command line options available within kubectl to view and modify the KubeConfig files. To view the current file being used, run the `$ kubectl config view` command. 
- This command lists the cluster's contexts and users, as well as the current context that is set. As we discussed earlier, if you do not specify which KubeConfig file to use, it ends up using the default file located in the folder .kube in the user's home directory.
- You can also specify a KubeConfig using `--kubeconfig` option in the command;

 We will move our custom config to the home directory so this becomes our default config file.

## Changing Contexts

After setting the current-context attribute in the KubeConfig yaml file, the current context is "dev-user@aws". So how do you update your current context, for example, to use prod user to access the production cluster? 

Run the `$ kubectl config use-context prod-user@production` command to change the current context to the prod user at production context. If you look at the KubeConfig file now, the current-context field is now updated.

kubeconfig.yaml
```
apiVersion: v1
kind: Config
current-context: prod-user@production 
...
```

 You can make other changes in the file such as creating, updating or deleting clusters, contexts and users using other variations of the kubectl config command.

## Namespaces
 
 What about namespaces? Each **cluster** may be configured with **multiple namespaces** within it. Can you configure a context to switch to a particular namespace? Yes. The context section in the KubeConfig file can take additional field called namespace where you can specify a particular namespace. This way, when you switch to that context, you will automatically be in a specific namespace.

kubeconfig.yaml
```
apiVersion: v1
kind: Config
clusters:
...

contexts:
- name: kube-admin@production
  context:
    cluster: production
    user: admin
    namespace: finance
    
users:
...
```

## Handling Certificates

You have seen paths to certificate files mentioned in kubeconfig like this:

kubeconfig.yaml
```
apiVersion: v1
kind: Config
clusters:
- name: kube-test-server
  cluster:
    certificate-authority: ca.crt
    server: https:kube-test-server:6443

contexts:
...
    
users:
- name: kube-admin 
  user:
    client-certificate: admin.crt
    client-key: admin.key
```
Well, it's better to use the full path like this:

kubeconfig.yaml
```
apiVersion: v1
kind: Config
clusters:
- name: kube-test-server
  cluster:
    certificate-authority: /etc/kubernetes/pki/ca.crt
    server: https:kube-test-server:6443

contexts:
...
    
users:
- name: kube-admin 
  user:
    client-certificate: /etc/kubernetes/pki/users/admin.crt
    client-key: /etc/kubernetes/pki/users/admin.key
```

Instead of using certificate authority field and the path to the file, you may optionally use the certificate authority data field **in a base64 format**. 

kubeconfig.yaml
```
apiVersion: v1
kind: Config
clusters:
- name: kube-test-server
  cluster:
    certificate-authority-data: MIIDdzCCAl+gAwIBAgIEbWZmOTANBgkqhkiG9w0BAQUFADBoMQswCQYDVQQGEwJVUzELMAkGA1UECBMCTlkxFDASBgNVBAcTC0FueXRvd24gQ2l0eTEQMA4GA1UEChMHQW55T3Jn
    ...
```

Similarly, if you see a file with the certificate's data in the encoded format, use the Base64 decode option to decode the certificate. 

`$ echo "MII..." | base64 --decode`