import numpy as np

import matplotlib.pyplot as plt

from matplotlib import rcParams
rcParams['figure.figsize'] = (10, 6)
rcParams['legend.fontsize'] = 16
rcParams['axes.labelsize'] = 16

from scipy.optimize import least_squares

N = 50
x = np.linspace(0, 100.0, N)
y_ideal = 1000*np.exp(-(x-30)**2/10) + 3*x + 15.0
y_synthetic = y_ideal + 5*np.random.randn(N)

plt.plot(x, y_ideal, 'k-')
plt.plot(x, y_synthetic, 'ko')

def model_fun(p, x):
    return p[0]*x + p[1]

def model(p, x, y):
    return y - model_fun(p, x)

p0 = [1.0, 1.0]

res_lsq = least_squares(model, p0, args=(x, y_synthetic))
p1 = res_lsq.x
print 'from ordinary lsq: ', p1
plt.plot(x, model_fun(p1, x), 'g-')

res_lsq_robust = least_squares(model, p0, loss='cauchy', args=(x, y_synthetic))
p2 = res_lsq_robust.x
print 'from robust lsq: ', p2
plt.plot(x, model_fun(p2, x), 'b-')

plt.show()
