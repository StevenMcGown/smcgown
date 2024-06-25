---
title: K8s 4.3 - Configuring Configmaps
date: 2024-05-09T07:07:07
summary: Detailed guide on how to configure Configmaps in Kubernetes
---
We have previously learned how to define environment variables in a pod definition file. <mark>When you have a lot of pod definition files, it will become difficult to manage the environment data stored within the query's files.</mark> We can take this information out of the pod definition file and <mark>manage it centrally using configuration maps</mark>. 

**Config maps** are used to pass configuration data in the form of key-value pairs in Kubernetes. When a pod is created, inject the config map into the pod so the key-value pairs are available as environment variables for the application hosted inside the container in the pod.

Pod definition **before** taking the `env` information out of the definition file:

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
    env:
      - name: APP_COLOR
        value: blue
      - name: APP_MODE
        value: prod
```

Here's the pod definition and ConfigMap **after** taking the `env` information out of the definition file:

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
    - configMapRef:
        name: app-config
```

app-config
```
APP_COLOR: blue
APP_MODE: prod
```

---

<mark>There are two steps involved in configuring config maps: First, create the config map. Second, inject them into the pod. </mark>
# Create the ConfigMap

Just like any other Kubernetes object, there are two ways of creating a config map

1) The **imperative** way **without using a config map** definition file.
- `$ kubectl create configmap <configname> --from-literal=<key>=<value>`
- To add multiple key-value pairs, just specify the `--from-literal` option many times. 
```
$ kubectl create configmap \
	appconfig --from-literal=APP_COLOR=blue \
	appconfig --from-literal=APP_MODE=prod
```
  - However, this can get complicated when you have too many configuration items, which is why you may use a file. 
- `$ kubectl create config map <configname> --from-file=<path-to-file>
- `$ kubectl create config map app-config --from-file=app_config.properties
- The data from this file is read and stored under the name of the file. 

2) The declarative way, by **using a config map** definition file.
- For this, we create a definition file, just like how we did for the pod using `$ kubectl create -f <file-name>`

config-map.yaml
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data: 
  APP_COLOR: blue
  APP_MODE: prod
```

You can create as many config maps as you need in the same way for various different purposes. 
- Here is one for application, another for mySQL, and another one for Redis. So it's important to name the config maps appropriately, as you will be using these names later while associating them with pods.

app-config
```
APP_COLOR: blue
APP_MODE: prod
```

mysql-config
```
port: 3306
max_allowed_packet: 128M
```

redis-config
```
port: 6379
rdb-compression: yes
```


To view config maps, run `$ kubectl get configmaps`
- This lists the newly created config map named app config. 

The `$ kubectl describe configmaps` command lists the configuration data as well under the data section. 

---

# Configuring the ConfigMap with a Pod

Now that we have the config map created, let us proceed with step two, injecting (configuring) it with a pod. Here we have the same ConfigMap as before, and a simple pod definition file that runs a simple web application.

config-map.yaml
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config # This is what connects the ConfigMap to the pod
data: 
  APP_COLOR: blue
  APP_MODE: prod
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
    - configMapRef:
        name: app-config # This is what connects the ConfigMap to the pod
```

To inject an environment variable, add a new property to the container called `envFrom`. 
- This property is a list, so we can pass as many environment variables as required. Each item in the list corresponds to a config map item. 
- Specify the name of the config map we created earlier. This is how we inject a specific config map from the ones we created before. 

If we were to use the hypothetical 'simple-webapp-color' web application using this configuration, the website background would now be blue.

What we just saw was using config maps to inject environment variables. Again, this was the relevant YAML for injecting environment variables:
```
 envFrom:
    - configMapRef:
        name: app-config 
```

There are other ways to inject configuration data into pods, though. 
- You can inject it as a single environment variable 
```
env:
  - name: APP_COLOR
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: APP_COLOR
```
- You can also inject the whole data as files in a volume.
```
volumes:
- name: app-config-volume
  configMap:
    name: app-config
```
- This is how this was done before when we looked at creating Multiple Schedulers