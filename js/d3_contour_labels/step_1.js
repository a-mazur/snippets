"use strict";

// Generate data
const N = 320,
  M = 240,
  amplitudes = new Float32Array(N * M);

// Peaks
var peaks = [{
    x: 250,
    y: 160,
    label: "red",
    amplitude: 30,
    sigma: 3.0
  },
  {
    x: 30,
    y: 10,
    label: "green",
    amplitude: -20,
    sigma: 2.0
  }
];

amplitudes.forEach(function(amp, idx, array) {
  //console.log(amp, idx);
  let iy = Math.trunc(idx / N),
    ix = idx % N;
  // noise
  array[idx] = randn_bm();
  // peaks
  peaks.forEach((p) => {
    array[idx] += p.amplitude * gauss2D(ix + 0.5, iy + 0.5, p.x, p.y, p.sigma)
  });
});

// Contour parameters
var contour_params = {
  threshold: 2.0,
  factor: 1.30,
  number: 16,
  sign: "both"
};

update_contour_levels(contour_params);

// Actual spectrum contour plot
var graph = {};

graph.svg = d3.select("#contour-plot");
graph.width = +graph.svg.attr("width");
graph.height = +graph.svg.attr("height");
graph.margins = {
  top: 10,
  right: 10,
  bottom: 25,
  left: 40
};

var xy_plane = {};
xy_plane.width = graph.width - graph.margins.left - graph.margins.right;
xy_plane.height = graph.height - graph.margins.top - graph.margins.bottom;

graph.main_g = graph.svg
  .append("g")
  .attr("id", "main-g")
  .attr("transform", function() {
    return "translate(" + graph.margins.left + "," + graph.margins.top + ")";
  });

graph.svg.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", xy_plane.width)
  .attr("height", xy_plane.height);

graph.data_clip = graph.main_g
  .append("g")
  .attr("id", "data-clip")
  .attr("clip-path", "url(#clip)"); //append clip path to limit visibility

graph.data_g = graph.data_clip
  .append("g")
  .attr("id", "data-group")
  // .attr("class", "data-group")
  .attr("clip-path", "url(#clip)");

xy_plane.x = d3.scaleLinear()
  .domain([N, 0])
  .range([xy_plane.width, 0]);

xy_plane.y = d3.scaleLinear()
  .domain([M, 0])
  .range([0, xy_plane.height]);

xy_plane.cx = xy_plane.x;
xy_plane.cy = xy_plane.y;

xy_plane.xAxis = d3.axisBottom(xy_plane.x)
  .ticks(5)
  .tickSize(-xy_plane.height)

xy_plane.gX = graph.main_g.append("g")
  .attr("class", "axis axis--x")
  .call(xy_plane.xAxis)
  .attr("transform", "translate(0," + xy_plane.height + ")");

xy_plane.yAxis = d3.axisLeft(xy_plane.y)
  .ticks(5)
  .tickSize(-xy_plane.width);

xy_plane.gY = graph.main_g.append("g")
  .attr("class", "axis axis--y")
  .call(xy_plane.yAxis)
//.attr("transform", "translate(" + graph.margins.left + ",0)");

xy_plane.plot = function() {
  xy_plane.spc_path = graph.data_g
    .append("g")
    .attr("id", "contour-group")
    .selectAll("path")
    .data(d3.contours()
      .size([N, M])
      .thresholds(contour_params.levels)
      (amplitudes))
    .enter()
    .append("path")
    .attr("d", d3.geoPath(null)
      .projection(matrix_transformation(xy_plane.width / N, 0, 0, -xy_plane.height / M, 0, xy_plane.height)))
    .attr("fill", function(d) {
      return "transparent";
    })
    .attr("stroke", function(d) {
      if (d.value > 0) return d3.color("rgb(255, 0, 0)");
      else if (d.value < 0) return d3.color("rgb(0, 255, 0)");
      else return d3.color("rgb(255, 255, 0)");
    })
    .attr("vector-effect", "non-scaling-stroke");

  xy_plane.spc_path.mtx = {
    kx: 1.0,
    ky: 1.0,
    tx: 0.0,
    ty: 0.0
  };

  xy_plane.peaks_g = graph.data_g.append("g")
    .attr("id", "peak-group");

  update_peaks(peaks)
}

xy_plane.plot();

d3.selectAll(".tick").selectAll("line")
  .attr("opacity", "0.3");

graph.overlayX = graph.main_g
  .append("rect")
  .attr("fill", "rgba(255,0,0,0.5)")
  .attr("width", xy_plane.width)
  .attr("height", graph.margins.bottom)
  .attr("y", xy_plane.height)

graph.overlayY = graph.main_g
  .append("rect")
  .attr("fill", "rgba(0,255,0,0.5)")
  .attr("width", graph.margins.left)
  .attr("height", xy_plane.height)
  .attr("x", -graph.margins.left)

//append the rectangle to capture zoom
graph.overlayRect = graph.main_g.append("rect")
  .attr("class", "overlay-rect")
  .attr("width", xy_plane.width)
  .attr("height", xy_plane.height)
  .style("fill", "none") // **********
  .style("pointer-events", "all") // **********
  // .on("mouseover", function() {
  //   graph.focus.style("display", null);
  // })
  // .on("mouseout", function() {
  //   graph.focus.style("display", "none");
  // })
  // .on("mousemove", mousemove)
  //.call(graph.zoomXY)
  .on("dblclick.zoom", function() {
    resetZoom();
  })
  .on("mousedown.rectZoom", rectZoom);

// Zooms
graph.zoomX = d3.zoom()
  .scaleExtent([1, 16])
  .on("zoom", () => {
    zoomed("x");
  });
graph.zoomY = d3.zoom()
  .scaleExtent([1, 16])
  .on("zoom", () => {
    zoomed("y");
  });

function update_peaks(pks) {

  let ms = 5;

  var sele = xy_plane.peaks_g
    .selectAll("polyline")
    .data(pks)


  sele.enter()
    .append("polyline")
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
    })
    .attr("vector-effect", "non-scaling-stroke");

  sele.enter()
    .append("text")
    .attr("x", (d) => {
      return xy_plane.x(d.x) + ms
    })
    .attr("y", (d) => {
      return xy_plane.y(d.y) - ms
    })
    .text((d) => d.label);

  sele.exit().remove();
}

function up_peaks() {
  xy_plane.peaks_g
    .selectAll("polyline").each(function(d, i) {
      var sel = d3.select(this);

      // console.log(d, x, y)
      let ms = 5;

      sel.attr("points", (d) => {
        let x = xy_plane.x(d.x) * xy_plane.spc_path.mtx.kx + xy_plane.spc_path.mtx.tx,
          y = xy_plane.y(d.y) * xy_plane.spc_path.mtx.ky + xy_plane.spc_path.mtx.ty;
        return [
          [x - ms, y],
          [x + ms, y],
          [x, y],
          [x, y - ms],
          [x, y + ms]
        ]
      })
    })

  xy_plane.peaks_g
    .selectAll("text").each(function(d, i) {
      var sel = d3.select(this);
      let x = xy_plane.x(d.x) * xy_plane.spc_path.mtx.kx + xy_plane.spc_path.mtx.tx + 5,
        y = xy_plane.y(d.y) * xy_plane.spc_path.mtx.ky + xy_plane.spc_path.mtx.ty - 5;

      // console.log(d, x, y)

      sel.attr("x", x);
      sel.attr("y", y);
    })
}

function zoomed(axis) {
  if (axis == "x") {
    var tX = d3.zoomTransform(graph.overlayX.node());
    xy_plane.cx = tX.rescaleX(xy_plane.x); // current x
    xy_plane.gX.call(xy_plane.xAxis.scale(tX.rescaleX(xy_plane.x)));

    xy_plane.spc_path.mtx.kx = tX.k;
    xy_plane.spc_path.mtx.tx = tX.x;

    var t_matrix = "matrix(" + xy_plane.spc_path.mtx.kx + ",0,0," + xy_plane.spc_path.mtx.ky + "," +
      xy_plane.spc_path.mtx.tx + "," + xy_plane.spc_path.mtx.ty + ")";

    xy_plane.spc_path.attr("transform", t_matrix);

    console.log("x:", t_matrix)
  }
  if (axis == "y") {
    var tY = d3.zoomTransform(graph.overlayY.node());
    xy_plane.cy = tY.rescaleY(xy_plane.y); // current y
    xy_plane.gY.call(xy_plane.yAxis.scale(tY.rescaleY(xy_plane.y)));

    xy_plane.spc_path.mtx.ky = tY.k;
    xy_plane.spc_path.mtx.ty = tY.y;

    var t_matrix = "matrix(" + xy_plane.spc_path.mtx.kx + ",0,0," + xy_plane.spc_path.mtx.ky + "," +
      xy_plane.spc_path.mtx.tx + "," + xy_plane.spc_path.mtx.ty + ")";

    xy_plane.spc_path.attr("transform", t_matrix);

    console.log("y:", t_matrix)
  }

  up_peaks();
  d3.selectAll(".tick").selectAll("line")
    .attr("opacity", "0.3");
}

function rectZoom() {
  d3.event.preventDefault();

  var element = this;
  var mouseOrigin = d3.mouse(element);
  var rect = null;

  if (d3.event.ctrlKey) {
    rect = graph.main_g.append("rect")
      .attr("fill", "rgba(0, 0, 255, 0.1)")
      .attr("stroke", "blue");
  }

  mouseOrigin[0] = Math.max(0, Math.min(xy_plane.width, mouseOrigin[0]));
  mouseOrigin[1] = Math.max(0, Math.min(xy_plane.height, mouseOrigin[1]));

  if (d3.event.shiftKey) {
    console.log("select", mouseOrigin);
    console.log("x, y: ", xy_plane.x.invert(mouseOrigin[0]), xy_plane.y.invert(mouseOrigin[1]))
    console.log("x, y: ", xy_plane.cx.invert(mouseOrigin[0]), xy_plane.cy.invert(mouseOrigin[1]))
    return;
  }

  d3.select(window)
    .on("mousemove.drag", function() {
      if (d3.event.ctrlKey) {
        return;
      }
      console.log("mouse move.drag")

      let m = d3.mouse(element);

      m[0] = Math.max(0, Math.min(xy_plane.width, m[0]));
      m[1] = Math.max(0, Math.min(xy_plane.height, m[1]));

      dragged(mouseOrigin, m);
      mouseOrigin = m;
    })
    .on("mouseup.drag", function() {
      if (d3.event.ctrlKey) {
        return;
      }

      if (rect != null) { // if ctrl released before mouse down
        rect.remove();
      }

      d3.select(window)
        .on("mousemove.drag", null)
        .on("mouseup.drag", null)
        .on("mousemove.zoomRect", null)
        .on("mouseup.zoomRect", null);
    })
    // Zoom
    .on("mousemove.zoomRect", function() {
      if (!d3.event.ctrlKey || rect === null) { // rect === null happens when ctrl pressed during drag
        return;
      }

      let m = d3.mouse(element);

      m[0] = Math.max(0, Math.min(xy_plane.width, m[0]));
      m[1] = Math.max(0, Math.min(xy_plane.height, m[1]));

      rect.attr("x", Math.min(mouseOrigin[0], m[0]))
        .attr("y", Math.min(mouseOrigin[1], m[1]))
        .attr("width", Math.abs(m[0] - mouseOrigin[0]))
        .attr("height", Math.abs(m[1] - mouseOrigin[1]));
    })
    .on("mouseup.zoomRect", function() {
      if (!d3.event.ctrlKey || rect === null) { // rect === null happens when ctrl pressed during drag
        return;
      }

      d3.select(window)
        .on("mousemove.drag", null)
        .on("mouseup.drag", null)
        .on("mousemove.zoomRect", null)
        .on("mouseup.zoomRect", null);

      var m = d3.mouse(element);

      m[0] = Math.max(0, Math.min(xy_plane.width, m[0]));
      m[1] = Math.max(0, Math.min(xy_plane.height, m[1]));

      dragged(mouseOrigin, m, true);

      rect.remove();
    }, true);

  d3.event.stopPropagation();
}

function resetZoom() {
  graph.overlayX
    // .transition().duration(100)
    .call(graph.zoomX.transform, d3.zoomIdentity);

  graph.overlayY
    // .transition().duration(100)
    .call(graph.zoomY.transform, d3.zoomIdentity);
}

function dragged(m0, m1, zoom = false) {
  if (!zoom || m1[0] !== m0[0] && m1[1] !== m0[1]) {
    console.log("mouse:", m0, m1)

    var scaleFactor = 1.0;
    if (zoom) {
      var zoomRectWidth = Math.abs(m1[0] - m0[0]);
      scaleFactor = xy_plane.width / zoomRectWidth;
    }
    var e = graph.overlayX;
    var t = d3.zoomTransform(e.node());

    var translateX = m0[0] - m1[0];
    if (zoom)
      translateX = Math.min(m0[0], m1[0]);

    console.log("t_x:", translateX, t.x, t.k)

    // e.transition().duration(750)
    e.call(graph.zoomX.transform, d3.zoomIdentity
      .scale(scaleFactor)
      .translate(-translateX, 0)
      .translate(t.x, 0)
      .scale(t.k)
    );

    if (zoom) {
      var zoomRectHeight = Math.abs(m1[1] - m0[1]);
      scaleFactor = xy_plane.height / zoomRectHeight;
    }
    var e = graph.overlayY;
    var t = d3.zoomTransform(e.node());

    var translateY = m0[1] - m1[1];
    if (zoom)
      translateY = Math.min(m0[1], m1[1]);

    console.log("t_y:", translateY, t.y, t.k)
    // e.transition().duration(750)
    e.call(graph.zoomY.transform, d3.zoomIdentity
      .scale(scaleFactor)
      .translate(0, -translateY)
      .translate(0, t.y)
      .scale(t.k)
    );
  };
}
