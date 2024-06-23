---
title: Data Science Zero to Hero - 1.1 Numpy
date: 2023-06-24T07:07:07+01:00
---

Numpy is a Python library used for working with arrays, linear algebra, matrices, and much more. It’s a fantastic tool for anyone who wants to work with numerical data in Python, particularly in the context of data science and machine learning. Numpy is used extensively in machine learning algorithms, so it’s good to have some experience with it if you want to be able to create any ML solutions.

This post will assume that you already have some programming experience with Python. In the future I might put out some posts on Python programming, but there are plenty of great videos and websites that can teach you how to program with Python.

![Numpy Meme](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/efdxbre05d686zqmn3li.png)

The most basic thing to know about Numpy is a numpy array. You may be familiar with arrays already; in its most basic form, a 1 dimensional array is just a row of data. This can be anything, but most of the time we use these arrays for numbers, strings, or even a mix of both. 

For example, let's create a Numpy array with the following values:

```
import numpy as np
mixed_array = np.array(['Apple', 10, 'B', 5, 'Banana', 7.5, 'D', 3])
```

You can see that we have an array that contains a mix of strings, characters, integers and floating point numbers. We can reference items in the array like so:

```
mixed_array[0]
# Outputs "Apple"
```

This will give us the value stored in the second compartment of the array, which is 4.

Like an egg carton, a 2D array has compartments, or cells, that can hold values. An array with 2 or dimensions is also called a matrix. Each cell is identified by an index, which is like the number of the compartment in the egg carton. 

![eggs](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/48e6wr7b4orr5i7dzrx5.jpg)

Just like we did in the previous example, we can take an element out of the array. An important thing to notice with this is that because it is a 2D array, each element is an array. So when we index the first element in the array (0), we will get the first row in our array.

```
egg_array = np.array([['egg1','egg2','egg3','egg4','egg5','egg6'],
                      ['egg7','egg8','egg9','egg10','egg11','egg12']])

print(egg_array[0])

# Outputs: ['egg1' 'egg2' 'egg3' 'egg4' 'egg5' 'egg6']
```

We can also slice a NumPy array, just like we can take out a row of eggs from an egg carton. For example, let's say we want to get the second and third values from the array:
```
egg_array = np.array([['egg1','egg2','egg3','egg4','egg5','egg6'],
                      ['egg7','egg8','egg9','egg10','egg11','egg12']])


print(egg_array[0][1:3])

# Outputs: ['egg2' 'egg3']
```
This outputs a new array with the values in the second and third compartments. Taking a closer look, we can see that we index the first array in the matrix with [0] and then the 2nd through 3rd elements in the array with [1:3].

You might be wondering why is it that the 2nd and 3rd elements are selected with [1:3] and not [2:3]? In Python, when using slicing notation start:end, the start index is inclusive, while the end index is exclusive. It means that the range of elements selected includes the element at the start index but excludes the element at the end index.

Great! Now that we understand how to index and slice arrays, let’s simplify our array just a little bit, so that each egg is represented as a number instead of a string. 

Just like you can add or subtract eggs from an egg carton, you can perform operations on a NumPy array. For example, let's say we want to multiply all the values in our array by 2:

```
print(egg_carton * 2) 
# Outputs: [4, 8, 12, 16]
```
This will give us a new array with the values doubled.

You can also concatenate, or combine, two or more arrays together, just like you can stack multiple egg cartons on top of each other. For example, let's say we have two arrays:

egg_carton1 = np.array([1, 2, 3])
egg_carton2 = np.array([4, 5, 6])
We can concatenate them together like this:

```
print(np.concatenate([egg_carton1, egg_carton2])) 
# Outputs: [1, 2, 3, 4, 5, 6]
```
This will give us a new array with all the values from both arrays.

Finally, just like you can split an egg carton into two or more parts, you can split a NumPy array into smaller arrays. For example, let's say we have an array with six values:

```
egg_carton3 = np.array([1, 2, 3, 4, 5, 6])
```
We can split it into two arrays of equal size like this:
```
print(np.split(egg_carton3, 2)) 
# Outputs: [array([1, 2, 3]), array([4, 5, 6])]
```
This will give us a list of two new arrays, each containing half of the values from the original array.

*There are plenty of other concepts to learn about numpy, but for the sake of brevity, I'm going to cover the essentials in this post. If you would like to know more, please explore the numpy documentation!*

So there you have it – a NumPy array is like an egg carton for numbers, with compartments that can be indexed, sliced, operated on, concatenated, and split! There are many useful things that you can do with Numpy that are more advanced and won’t be covered in this post. After you read this, I encourage you to dive deeper into the documentation if you’re interested in learning more.

Thanks for reading!