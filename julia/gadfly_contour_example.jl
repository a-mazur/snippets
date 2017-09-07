function contour1()
  sigma = 3.0
  x0 = 30
  y0 = 60

  x = y = [1.0*i for i in 1:100]

  z = zeros(Float64, (100, 100))
  for i in 1:100 for j in 1:100
    z[i,j] = 1000*exp((-1.0/sigma^2) * ((x[i] - x0)^2 + (y[j] - y0)^2 ))
  end end


  # z_ = [z[i:i+99] for i in 1:100:10000]

  plot(z=z, Geom.contour)#,x=x, y=y, Geom.contour(levels=[10, 100, 300, 900]))
end
