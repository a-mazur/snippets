function contour1()
  sigma = 3.0
  x0 = 30
  y0 = 60

  x = y = [1.0*i for i in 1:100]
  z = [ 1000*exp((-1.0/sigma^2) * ((x[i] - x0)^2 + (y[j] - y0)^2 ))
      for i in 1:100 for j in 1:100]

  z_ = [z[i:i+99] for i in 1:100:10000]

  data1 = contour(;z=z_, x=x, y=y,
                   autocontour=false,
                   contours=Dict(:start=>500, :end=>1000, :size=>100),
                   contours_coloring="lines",)

  data2 = scatter(;x=[2,4], y=[-4,3], text=["a", "B"])

  plot([data1, data2])
end
