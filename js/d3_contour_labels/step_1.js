// Generate data
const N = 100,
  M = 150;
amplitudes = new Float32Array(N * M);

amplitudes.forEach(function(amp, idx, array) {
  //console.log(amp, idx);
  let iy = Math.trunc(idx / N),
    ix = idx % N;
  array[idx] = 100 * gauss2D(ix, iy, 20.0, 60.0, 0.5) +
    -100 * gauss2D(ix, iy, 30.0, 10.0, 0.5) +
    randn_bm();
});

// Peaks
var peaks = [{
    x: 20,
    y: 60,
    label: "red"
  },
  {
    x: 30,
    y: 10,
    label: "green"
  }
];

// Contour parameters
var contour_params = {
  threshold: 1.0,
  factor: 1.2,
  number: 16,
  sign: "both"
};

update_contour_levels(contour_params);

// Actual spectrum contour plot
xy_plane = {};

xy_plane.svg = d3.select("#xy-plane");

xy_plane.width = +xy_plane.svg.attr("width");
xy_plane.height = +xy_plane.svg.attr("height");

xy_plane.x = d3.scaleLinear()
  .domain([N, 0])
  .range([xy_plane.width, 0]);

xy_plane.y = d3.scaleLinear()
  .domain([M, 0])
  .range([xy_plane.height, 0]);

// xy_plane.xAxis = d3.axisBottom(xy_plane.x); //.ticks(null, ".1f");

xy_plane.spc_path = xy_plane.svg.selectAll("path")
  .data(d3.contours()
    .size([N, M])
    .thresholds(contour_params.levels)
    (amplitudes))
  .enter()
  .append("path")
  .attr("d", d3.geoPath(null)
    .projection(matrix_transformation(xy_plane.width / N, 0, 0, -xy_plane.height / M, 0, xy_plane.height))) // full svg
  .attr("fill", function(d) {
    return "transparent";
  })
  .attr("stroke", function(d) {
    if (d.value > 0) return d3.color("rgb(255, 0, 0)");
    else if (d.value < 0) return d3.color("rgb(0, 255, 0)");
    else return d3.color("rgb(255, 255, 0)");
  })
  .attr("vector-effect", "non-scaling-stroke");

var ms = 5;

xy_plane.peaks = xy_plane.svg.append("g")
  .selectAll("lines")
  .data(peaks)
  .enter();

xy_plane.peaks.append("polyline")
  //.attr("r", 5)
  .attr("points", (d) => {
    let x = xy_plane.x(d.x),
      y = xy_plane.y(d.y);
    return [
      [x - ms, y],
      [x + ms, y],
      [x, y],
      [x, y - ms],
      [x, y + ms]
    ]
  });
// .append("circle")
// .attr("r", 5)
// .attr("cx", (d) => xy_plane.x(d.x))
// .attr("cy", (d) => xy_plane.y(d.y));

xy_plane.peaks.append("text")
  .attr("x", (d) => xy_plane.x(d.x))
  .attr("y", (d) => xy_plane.y(d.y))
  .text((d)=>d.label);
