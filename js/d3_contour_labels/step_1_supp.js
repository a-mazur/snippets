"use strict";

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function gauss2D(x, y, x0, y0, sigma) {
  let r = Math.sqrt((x - x0) ** 2 + (y - y0) ** 2);
  return Math.exp(-(r*r / (2*sigma*sigma)));
}

function update_contour_levels(cp) {
  var levels_positive = [],
    levels_negative = [];
  for (var i = 0; i < cp.number; i++) {
    levels_positive[i] = cp.threshold * cp.factor ** i;
    levels_negative[i] = -levels_positive[i];
  }
  levels_negative.reverse();
  cp.levels = levels_negative.concat(levels_positive);
}

function matrix_transformation(a, b, c, d, tx, ty) {
  return d3.geoTransform({
    point: function(x, y) {
      this.stream.point(a * x + b * y + tx, c * x + d * y + ty);
    }
  });
}
