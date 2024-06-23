---
title: Data Science Zero to Hero - 1.2 Pandas
date: 2023-06-25T07:07:07+01:00
---
Pandas are nature's adorable, bamboo-munching- wait, not that kind of panda...

![panda](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fvtw7205qir18dzywdg7.jpg)

Much less cute but much more useful for data science, Pandas is a popular open-source Python library that provides powerful data manipulation and analysis tools. The name "Pandas" is derived from "Panel Data," reflecting its original focus on handling and analyzing financial data with panel data structures. 

It is built on top of NumPy and offers easy-to-use data structures and data analysis functionalities. In this blog post, we will explore various features and capabilities of Pandas, including Series, DataFrames, reading data, manipulation techniques, merging and joining, reshaping data, pivot tables, duplication, mapping and replacing values, and grouping data.

This one's going to be long, so put on your seat belts!

1. [Pandas Series: Foundations of Data Manipulation](#pandas-series-foundations-of-data-manipulation)
2. [DataFrames: Tabular Data Made Easy](#dataframes-tabular-data-made-easy)
3. [Reading Data into Pandas](#reading-data-into-pandas)
4. [Concatenation, Merge, and Joining: Combining DataFrames](#concatenation-merge-and-joining-combining-dataframes)
5. [Reshaping Data: Pivoting and Melting](#reshaping-data-pivoting-and-melting)
6. [Duplication: Identifying and Handling Duplicate Data](#duplication-identifying-and-handling-duplicate-data)
7. [Map and Replace: Modifying Values in DataFrames](#map-and-replace-modifying-values-in-dataframes)
8. [GroupBy: Aggregating and Analyzing Data](#groupby-aggregating-and-analyzing-data)
9. [Conclusion](#conclusion)

## Pandas Series: Foundations of Data Manipulation

At the core of Pandas lies the concept of a __Series__. A Series is a one-dimensional labeled array that can hold any data type, such as integers, strings, or even Python objects. It consists of two main components: the index and the data.

The index is an array-like structure that holds labels for each element in the Series, allowing for fast and efficient data access. The data component contains the actual values associated with each index label.

### Creating a series
We can create a series from a list like so:
```
import pandas as pd

# Creating a Series from a list
my_list = [10, 20, 30, 40, 50]
my_series = pd.Series(my_list)
print(my_series)

# Outputs:
0    10
1    20
2    30
3    40
4    50
dtype: int64
```

### Indexing and slicing a Series
To index a series, we simply put the index of the series that we want to retrieve in brackets. Like we have seen before in numpy, we can slice the series by indexing with an inclusive start value and a exclusive end value separated by a colon.
```
print(my_series[2])
print(my_series[1:4])

# Outputs:
30
1    20
2    30
3    40
dtype: int64
```

### Filtering values in a Series
...is as simple as this. Remember that our series contains the values 10, 20, 30, 40 and 5. So it makes sense that we only see the values greater than 30 here:
```
print(my_series[my_series > 30])

# Outputs:
3    40
4    50
dtype: int64
```

### Performing arithmetic operations on a Series
In this example, we're multiplying all of the values in the series by 2.
```
print(my_series * 2)

# Outputs:
0     20
1     40
2     60
3     80
4    100
dtype: int64
```

Manipulating Series is a fundamental task in Pandas. You can create a Series from various data sources, such as Python lists or dictionaries. Additionally, you can perform operations like indexing, slicing, filtering, and arithmetic operations on Series, enabling powerful data transformations.

## DataFrames: Tabular Data Made Easy
It's worth noting at this point that Pandas isn't really great for manipulating _large_ datasets for a number of reasons (not parallelizing operations, loading the whole data set in memory, etc). There are other data manipulation libraries like Dask and Vaesk that may work better with larger data sets, and you may be waiting a while if you try to do these operations on a very large dataset.

![skeleton](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ys1qasil30kcdf7fvcba.jpg)

Now that we have learned about series which are 1-dimensional, we will look at __Data Frames__.
DataFrames are two-dimensional labeled data structures in Pandas, inspired by the concept of tables in relational databases. They are essentially a collection of Series that share a common index, allowing for intuitive and efficient data handling.

### Creating a Pandas data frame from a python dictionary
Pandas easily transforms Python dictionaries into data frames for efficient data manipulation and analysis.
```
import pandas as pd

### Creating a DataFrame from a dictionary
data = {'Name': ['John', 'Emma', 'Ryan'],
        'Age': [25, 30, 35],
        'City': ['New York', 'London', 'Sydney']}
df = pd.DataFrame(data)
print(df)

# Outputs:
   Name  Age       City
0  John   25   New York
1  Emma   30     London
2  Ryan   35     Sydney
```

### Selecting specific columns in a DataFrame
Just like you can index a series, you can index the columns of a data frame as well.
```
print(df['Name'])
print(df[['Name', 'Age']])

# Outputs:
0    John
1    Emma
2    Ryan
Name: Name, dtype: object

   Name  Age
0  John   25
1  Emma   30
2  Ryan   35
```

### Filtering rows based on conditions
This works exactly like filtering on series.
```
print(df[df['Age'] > 28])

# Outputs:
   Name  Age      City
1  Emma   30    London
2  Ryan   35    Sydney
```

### Sorting a DataFrame
You can sort the rows of a dataframe on the names of the columns.
```
print(df.sort_values('Age'))

# Outputs:
   Name  Age       City
0  John   25   New York
1  Emma   30     London
2  Ryan   35     Sydney

# Applying aggregate functions
print(df['Age'].mean())

# Outputs:
30.0
```

Manipulating DataFrames offers a wide range of possibilities for data analysis. You can create DataFrames from various data sources, including CSV files, Excel spreadsheets, and SQL databases. Once you have a DataFrame, you can perform operations like selecting specific columns, filtering rows based on conditions, sorting data, and applying aggregate functions.

### Reading Data into Pandas
Pandas provides several functions to read data from different file formats. Some commonly used methods include `read_csv()`, `read_excel()`, and `read_sql()`. These functions allow you to load data into DataFrames, making it easy to analyze and manipulate the data using Pandas' powerful functionality.
```
import pandas as pd

## Reading data from a CSV file
df = pd.read_csv('data.csv')
print(df.head())

# Outputs:
   Column1  Column2  Column3
0        1        2        3
1        4        5        6
2        7        8        9
3       10       11       12
4       13       14       15
```

## Concatenation, Merge, and Joining: Combining DataFrames
Concatenation, merging, and joining are techniques used to combine multiple DataFrames into a single DataFrame, allowing for comprehensive data analysis. Concatenation is the process of stacking DataFrames vertically or horizontally. Merging involves combining DataFrames based on common columns, similar to SQL joins. Joining is the process of combining DataFrames based on their index.

### Concatenating Dataframes
You can concatenate along two axes - axis 0 (rows) or axis 1 (columns). The default is axis 0. During concatenation, make sure the column names and index labels match correctly. If they don't, Pandas will create NaN values for non-matching elements.
```
import pandas as pd

# Concatenating DataFrames vertically
df1 = pd.DataFrame({'A': [1, 2, 3],
                    'B': [4, 5, 6]})
df2 = pd.DataFrame({'A': [7, 8, 9],
                    'B': [10, 11, 12]})
result = pd.concat([df1, df2])
print(result)

# Outputs:
   A   B
0  1   4
1  2   5
2  3   6
0  7  10
1  8  11
2  9  12
```
### Merging DataFrames based on a common column
You need a common key or set of keys to merge DataFrames. These keys serve as the basis for matching and combining rows. Pandas supports different types of merges - 'inner', 'outer', 'left', and 'right'. Each type specifies how the rows are combined based on the keys.
```
df1 = pd.DataFrame({'Key': ['A', 'B', 'C'],
                    'Value': [1, 2, 3]})
df2 = pd.DataFrame({'Key': ['B', 'C', 'D'],
                    'Value': [4, 5, 6]})
result = pd.merge(df1, df2, on='Key')
print(result)

# Outputs:
  Key  Value_x  Value_y
0   B        2        4
1   C        3        5
```

These operations provide flexibility in data integration and enable the user to perform more complex analyses by leveraging data from multiple sources.

## Reshaping Data: Pivoting and Melting
Reshaping data is a common task in data analysis, and Pandas provides functions to pivot and melt DataFrames. Pivoting involves transforming data from a "long" format to a "wide" format, creating new columns based on unique values in an existing column. Melt, on the other hand, transforms data from a "wide" format to a "long" format, unpivoting the data.
![pivot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kvgfs6xh87nxb7dfvj49.png)
So they're just the inverse operation of each other. Changing the structure from wide to long or long to wide is often necessary to adapt the data to different analysis, modeling, or visualization requirements. Each format has its advantages and is suitable for specific scenarios. For this section, I would highly suggest paying close attention to the outputs of these examples to see  they're doing. Not sure why, but it took me some time to understand these concepts.

### Pivoting
Again, pivoting is used to turn dataframes long to wide. Here's some examples of when that might be useful:
- **Redundancy Reduction:** Wide-format data can help reduce redundancy, especially when dealing with sparse data. By pivoting, you can consolidate related information into a more compact representation.
- **Visualization:** In some cases, a wide-format presentation may be more intuitive or easier to understand for certain types of visualizations, especially when there are fewer categorical variables.
- **Exporting Data:** For some specific use cases or external tools, a wide-format might be the preferred format for data export.

```
import pandas as pd

# Pivoting a DataFrame
df = pd.DataFrame({'Date': ['2023-01-01', '2023-01-02', '2023-01-03'],
                   'City': ['New York', 'London', 'Sydney'],
                   'Temperature': [32, 28, 35]})
pivot_table = df.pivot(index='Date', columns='City', values='Temperature')
print(pivot_table)

# Outputs:
City        London  New York  Sydney
Date                               
2023-01-01    NaN      32.0     NaN
2023-01-02   28.0       NaN     NaN
2023-01-03    NaN       NaN    35.0
```
### Melting
Once more, melting is for making dataframes wide to long.
- **Aggregation and Analysis:** When you need to perform aggregate functions or statistical analysis on multiple related columns, melting the data into a long format is often more convenient. It allows you to treat the column names as data values, making it easier to apply operations uniformly across different groups.
- **Visualization:** Certain visualization libraries or tools work better with data in a long format. For example, tools like Seaborn or Plotly often expect data in a long format for categorical data plotting.
- **Normalization:** Long-format data can help in data normalization and provide a standardized way to handle repeated measures.
```
df = pd.DataFrame({'Name': ['John', 'Emma', 'Tom'],
                   'Math': [95, 87, 92],
                   'Science': [88, 90, 85]})
melted_df = pd.melt(df, id_vars='Name', var_name='Subject', value_name='Score')
print(melted_df)

# Outputs:
   Name  Subject  Score
0  John     Math     95
1  Emma     Math     87
2   Tom     Math     92
3  John  Science     88
4  Emma  Science     90
5   Tom  Science     85
```

These reshaping techniques are particularly useful when working with datasets that require restructuring for better analysis and visualization.

## Duplication: Identifying and Handling Duplicate Data

Data duplication is a common issue in real-world datasets. Pandas offers functions to identify and handle duplicate data effectively. You can use methods like `duplicated()` and `drop_duplicates()` to detect and remove duplicate rows from DataFrames. By addressing duplication, you can ensure data integrity and obtain accurate insights from your analysis.

### Duplicating
```
import pandas as pd

# Identifying duplicate rows
df = pd.DataFrame({'Name': ['John', 'Jane', 'John'],
                   'Age': [25, 30, 25]})
duplicated_rows = df.duplicated()
print(duplicated_rows)

# Outputs:
0    False
1    False
2     True
dtype: bool
```
### Dropping duplicate rows

```
df = df.drop_duplicates()
print(df)

# Outputs:
   Name  Age
0  John   25
1  Jane   30
```

## Map and Replace: Modifying Values in DataFrames

Pandas provides convenient methods for mapping and replacing values in DataFrames. The `map()` function allows you to create new columns based on existing values or apply custom transformations to existing columns. The `replace()` function is useful for substituting specific values or patterns in a DataFrame with new values.

### Mapping Values
```
import pandas as pd

# Mapping values using a dictionary
df = pd.DataFrame({'Grade': ['A', 'B', 'C']})
grades_mapping = {'A': 'Excellent', 'B': 'Good', 'C': 'Average'}
df['Grade'] = df['Grade'].map(grades_mapping)
print(df)

# Outputs:
       Grade
0  Excellent
1       Good
2    Average
```
### Replacing Values
```
df = pd.DataFrame({'Age': [25, 30, 35, 40]})
df['Age'] = df['Age'].replace({30: 31, 35: 36})
print(df)

# Outputs:
   Age
0   25
1   31
2   36
3   40

```

These operations help in cleaning and transforming data, enabling you to make data more consistent and suitable for further analysis.

## GroupBy: Aggregating and Analyzing Data

GroupBy operations in Pandas allow you to split data into groups based on specified criteria, apply aggregation functions to each group, and combine the results. This functionality is invaluable for statistical analysis, as it enables you to compute summary statistics, perform group-level calculations, and gain insights into the data distribution.

### GroupBy
In this example, we create a DataFrame 'df' with population data for cities 'A' and 'B.' We then group the data by city and calculate the mean population for each group, creating a new DataFrame 'grouped_df' with the results. The output shows the average population for cities 'A' and 'B.'
```
import pandas as pd

# Grouping and calculating mean
df = pd.DataFrame({'City': ['A', 'B', 'A', 'B'],
                   'Population': [100000, 200000, 150000, 250000]})
grouped_df = df.groupby('City').mean()
print(grouped_df)

# Outputs:
      Population
City            
A         125000
B         225000
```
### Applying multiple aggregations
We can do multiple aggregations like so. This gives us both the sum and mean of the population for city A and B
```
df = pd.DataFrame({'City': ['A', 'B', 'A', 'B'],
                   'Population': [100000, 200000, 150000, 250000]})
aggregations = {'Population': ['sum', 'mean']}
grouped_df = df.groupby('City').agg(aggregations)
print(grouped_df)

# Outputs:
     Population          
            sum      mean
City                     
A        250000  125000.0
B        450000  225000.0
```
GroupBy operations are particularly useful when working with large datasets, as they allow you to analyze data at different granularities and identify patterns or trends within each group.

## Conclusion

Whew! You made it!! You're ready to go out into the world and confidently manipulate DataFrames with Pandas 🐼

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8adln1xnzymfnjghyhwm.png)

By leveraging Pandas' Series and DataFrame data structures, as well as various functions and operations, you can effectively handle, transform, and analyze data for a wide range of use cases.

In this blog post, we explored key aspects of Pandas, including Series manipulation, DataFrame operations, data reading, concatenation, merging, reshaping, duplication handling, mapping and replacing values, and GroupBy analysis. Armed with this knowledge, you can confidently dive into data analysis tasks and unleash the full potential of Pandas in your Python projects!