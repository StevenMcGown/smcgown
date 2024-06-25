---
title: K8s 6.13 - Service Accounts
date: 2024-05-31T07:07:07
summary: Detailed Overview of Service Accounts in Kubernetes
---
There are two types of accounts in Kubernetes: User accounts and service accounts.

**User accounts** are obviously used by users. This could be an administrator accessing the cluster for maintenance or other admin tasks, or even a developer using the cluster to deploy an application. 

**Service accounts** on the other hand, are used by automated processes to interact with the Kubernetes cluster. For example, Prometheus, a monitoring service, uses a service account to poll the Kubernetes API for metrics. You could also create a service account for an automated build tool like Jenkins to deploy applications.

### Create a Service Account and Use it
In order for tools like Prometheus and Jenkins to use the Kubernetes API, it must be authenticated. For that, we create a service account.
`$ kubectl create serviceaccount test-sa`

To view it, use: `$ kubectl get serviceaccount`

When the service account is created, it automatically creates a token under the "Token" attribute. The SA token is what must be used by the external application when authenticating to the K8s API. The token however, is stored as a secret object. Upon SA creation, the secret is created and thus linked to the SA object. You can view this secret using:

`$ kubectl describe secret <test-sa-secret-name>`

This token can then be used as an authentication bearer token when making a REST call to the k8s API.

`$ curl https://192.168.56.70:6443/api -insecure --header "Authorization: Bearer <token>"`

### Service Accounts for In-Cluster Applications
What if the application is hosted on the kubernetes cluster itself? In that case, this whole process of exporting the token to be used in the third-party application to use it can be made simple by automatically mounting the service token as a volume inside of the pod hosting the third-party application. That way, it can be easily read by the application and it doesn't have to be configured manually.

If you go back and list the service accounts, you will see there is a default SA that exists already for each namespace. These SAs were automatically created, and whenever a pod is created, the default SA and its token are automatically mounted to that pod as a volume mount.

For example, this pod uses a custom application image. Notice how we haven't specified any secrets or volume mounts.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: custom-k8s-app
spec: 
  containers:
    - name: custom-k8s-app
      image: custom-k8s-app
```

However, if you describe the pod, you see that a volume is automatically created from the secret named "default-token", which is in fact the secret containing the token for the default Service Account. 
`$ kubectl describe pod custom-k8s-app`

The secret token is mounted at the location `/var/run/secrets/kubernetes.io/serviceaccount` inside the pod. So from inside the pod, if you run `$ ls` to list the contents of the directory, you will see the secret mounted as three separate files. 

`$ kubectl exec -it custom-k8s-app -- ls /var/run/secrets/kubernetes.io/serviceaccount`

The three files are:
1. **ca.crt** - Contains the certificate authority bundle to verify the Kubernetes API server's SSL certificate.
2. **namespace** - Holds the name of the namespace where the pod is running.
3. **token** - Contains the service account's bearer token used for authenticating with the Kubernetes API.

The <mark>default SA is very much restricted an only has permissions to run basic k8s queries</mark>. If you want to use a different service account, specify the service account to use in the serviceAccountName field.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: custom-k8s-app
spec: 
  containers:
    - name: custom-k8s-app
      image: custom-k8s-app
  serviceAccountName: custom-sa
```

It's worth noting that **you can't edit the service account of an existing pod.** You must delete and re-create the pod. However in the case of a deployment, you will be able to edit the service account since any changes to the pod definition file will automatically trigger a new rollout for the deployment. So the deployment will take care of deleting and recreating the new pods with the right service account.

Kubernetes automatically mounts the default sevrice account if you haven't explicitly specified any. You may choose not to mount the service account automatically by setting the "automountServiceAccountToken" field to false.

pod-definition.yaml
```
apiVersion: v1
kind: Pod
metadata:
  name: custom-k8s-app
spec: 
  containers:
    - name: custom-k8s-app
      image: custom-k8s-app
  automountServiceAccountToken: false
```

### Service Accounts after 1.22 & 1.24 update
So as we know, each namespace has a default service account, and that service account has a secret object with a token associated with it. When a pod is created, it automatically associates the service account to the pod and mounts the token to a well known location within the pod which can be found if you do:

`$ kubectl describe pod custom-k8s-app`
```
Name:         custom-k8s-app
Namespace:    default
Annotations:  <none>
Status:       Running
IP:           10.244.0.15
Containers:
  nginx:
    Image:         custom-k8s-app
Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount
Conditions:
  Type:          Status
Volumes:
  default-token-ke3kd:
    Type:         Secret (a volume populated by a Secret)
    SecretName:   default-token-ke3kd
    Optional:     false
    
```
 In this case, the location is:
 "/var/run/secrets/kubernetes.io/serviceaccount"
 
And there are three seperate files which we saw above, ca.crt, namespace, and token. So what's different after 1.22 and 1.24? 

#### Version 1.22
If you were to decode this token, you would find that this token as **no expiry date defined in the payload section.**

`$ jq -R 'split(".") | select(length > 0) | .[0],.[1] | @base64d | fromjson <<< <token>' `

There are other security & scalability issues with this token outlined in the Kubernetes Enhancement Proposals (KEP) found [here](https://github.com/kubernetes/enhancements/tree/master/keps/sig-auth/1205-bound-service-account-tokens#summary)

Here is an excerpt:
*Kubernetes already provisions JWTs to workloads. This functionality is on by default and thus widely deployed. The current workload JWT system has serious issues:*

1. *Security: JWTs are not audience bound. **Any recipient of a JWT can masquerade as the presenter** to anyone else.*
2. *Security: The current model of storing the service account token in a Secret and delivering it to nodes results in a broad attack surface for the Kubernetes control plane when powerful components are run - giving a service account a permission means that **any component that can see that service account's secrets is at least as powerful as the component**.*
3. *Security: **JWTs are not time bound**. A JWT compromised via 1 or 2, is valid for as long as the service account exists. This may be mitigated with service account signing key rotation but is not supported by client-go and not automated by the control plane and thus is not widely deployed.*
4. *Scalability: JWTs require a Kubernetes **secret per service account.***

Thus in version 1.22, the TokenRequestAPI was introduced as part of the KEP 1205 to create a mechanism in which you can provision SA tokens that are more secure and scalable via an API. These tokens are audience bound, time bound and object bound, thus making them more secure.

Since 1.22, when a new pod is created, it no longer relies on the SA secret token. Instead, a token with a defined lifetime is generated through the TokenRequestAPI by the Service Account Admission Controller when the pod is created. This token is then mounted as a projected volume onto the pod.

e.g. `$ kubectl get pod custom-k8s-app -o yaml`
```
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: default
spec:
  containers:
  - image: nginx
    name: nginx
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-4Dj7ws
  volumes:
  - name: kube-api-access-4Dj7ws
    projected:
      defaultMode: 420
      sources:
      - serviceAccountToken:
          expirationSeconds: 3607
          path: token
      - configMap:
          items:
          - key: ca.crt
            path: ca.crt
          name: kube-root-ca.crt
      - downwardAPI:
          items:
          - fieldRef:
              apiVersion: v1
```

A **projected volume** in Kubernetes is a type of volume that <mark>allows you to map several existing volume sources into the same directory within a pod.</mark> If you examine the "sources" attribute, you'll notice that the secret, which is part of the service account, is now represented as a **projected volume**. This projected volume interacts with the token controller API's token request API to obtain a token for the pod.

#### Version 1.24
[KEP-2799](https://github.com/kubernetes/enhancements/tree/master/keps/sig-auth/2799-reduction-of-secret-based-service-account-token) focused on the reduction of secret-based service account tokens. As we saw before, when a service account was created, it automatically created a secret with a token that has no expiry and is not bound to any audience. This was then automatically mounted as a volume to any pod that uses that service account. Again, in 1.22, this behavior was changed. The automatic mounting of the secret object to the pod was replaced with the use of the token request API.

With 1.24, a change was created so when you create a service account, it no longer automatically creates a token access secret. After this change, you must run the Kubectl command to generate a token for that service account if you need one, which will print the token on screen.

`$ kubectl create serviceaccount custom-k8s-app-sa`
`$ kubectl create token custom-k8s-app-sa`

Now if you were to decode that token as we showed before, this time you will see an expiration date defined. If you don't specify the time, it will last an hour from the time that you run the command. You can however specify additional options to increase the expiry of the token. 

If you want to create secrets the old way with a non-expiring token, you can still do that by creating a secrets object with the type set to "kubernetes.io/service-account-token"

secret-definition.yaml
```
apiVersion: v1
kind: Secret
type: kubernetes.io/service-account-token
metadata:
  name: mysecretname
  annotations:
    kubernetes.io/service-account.name: custom-k8s-app-sa
```

When you're doing this, make sure that the SA is created before the secret, otherwise the secret object will not be created. You should only create a non-expiring token in this way if **the security-exposure of persisting a non-expiring token credential in a readable API object is acceptable** to you and you are **unable to use the TokenRequest API to obtain a token.** 