---
title: Data Science Zero to Hero - 2.1 The Machine Learning Cycle
date: 2023-06-26T07:07:07+01:00
type: "blog"
---
# Data Collection and Preparation: ML Concepts
Data, data, data! If there's one thing you should take away from this series, it's that data is **super important** to data scientists and Machine Learning Engineers alike. In the previous posts, we talked about different ways of transforming and visualizing data with Python and those libraries are certainly powerful tools, but where does this data come from anyway? How do we collect it? Where do we store it? What other steps might need to be taken? Furthermore, what do we do with that data once we have it? Questions like these are best answered with the steps in the _Machine Learning Cycle._

![mlcycle](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/06lk5mkb7bmf0g5gpbxu.png)

You see, the process of machine learning is cyclical because its purpose is to improve a machine learning model's performance on a _specific task_ as new data becomes available. These models should be flexible enough to incorporate that new data so that it doesn't become _biased_. This includes understanding how the data was collected and ensuring that it represents the problem space without inherent biases related to factors like gender, ethnicity, or socioeconomic status.

Depending on who you ask, the Machine Learning Cycle may vary, but the basic idea is this: Get the data, train a model, and then evaluate the results to do the process over again. Let's break the graphic above step by step.

1. **Data Collection:** This is the initial phase where all relevant data is gathered from various sources, whether structured or unstructured. It may include collecting data from databases, sensors, online sources, etc.
2. **Data Transformation:** Here, the data is cleaned and transformed into a suitable format for training models. It might involve handling missing values, encoding categorical variables, or normalizing numerical features.
3. **Exploratory Data Analysis (EDA):** Before diving into modeling, EDA helps in understanding the data's characteristics, distribution, and patterns. This step often includes visualizations, statistical tests, and preliminary insights. *Note: A preliminary or light EDA might be performed on the raw data **before transformation,** especially if you are dealing with an entirely new dataset, to get an initial sense of the data and to identify the transformations that might be needed.*
4. **Model Training and Evaluation:** This phase includes selecting the appropriate algorithm, training the model on the training dataset, and evaluating its performance using techniques like cross-validation on a validation dataset. Adjustments may be made to optimize performance.
5. **Model Deployment:** Once the model is trained and validated, it's deployed into a production environment where it can start making predictions or decisions based on new data.
6. **Model Monitoring:** Continuous monitoring ensures that the model performs well with the real-world data it encounters. Monitoring can detect issues like drifts in data or degraded performance.
7. **Model Retraining:** Models are not static; they might need to be retrained as new data becomes available or if the underlying data patterns change. Retraining ensures that the model remains accurate and relevant.

Each of these steps plays a critical role in creating a robust machine learning model. They collectively contribute to a cyclical process of continuous improvement and adaptation. In the next posts, we'll expand on each of these concepts in much more detail.
