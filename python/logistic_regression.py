import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression

# from wikipedia :
# https://en.wikipedia.org/wiki/Logistic_regression

hours = [0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 1.75, 2.00, 2.25, 2.50,
         2.75, 3.00, 3.25, 3.50, 4.00, 4.25, 4.50, 4.75, 5.00, 5.50]
exam_pass = [0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1]

data = []
for i in range(len(hours)):
    data.append((hours[i], exam_pass[i]))

df = pd.DataFrame(data, columns=["hours", "exam_pass"])
print df.head()

model = LogisticRegression(C=1e6, penalty="l1", solver="liblinear")
model.fit(df[["hours"]], df["exam_pass"])

plt.scatter(df["hours"], df["exam_pass"])
plt.plot(df["hours"], model.predict_proba(df[["hours"]])[:, 1], color="r")
plt.scatter(df["hours"], model.predict(df[["hours"]]), marker="x")
plt.xlabel("Measurement")
plt.show()
