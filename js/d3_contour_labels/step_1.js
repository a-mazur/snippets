"use strict";

// Generate data
const N = 100,
  M = 150,
  amplitudes = new Float32Array(N * M);

amplitudes.forEach(function(amp, idx, array) {
  //console.log(amp, idx);
  let iy = Math.trunc(idx / N),
    ix = idx % N;
  array[idx] = 30 * gauss2D(ix + 0.5, iy + 0.5, 20.0, 60.0, 3.0) +
    -30 * gauss2D(ix + 0.5, iy + 0.5, 30.0, 10.0, 1.0) +
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
  .attr("class", "main")
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
  .attr("clip-path", "url(#clip)"); //append clip path to limit visibility

graph.data_g = graph.data_clip
  .append("g")
  .attr("class", "data-group")
  .attr("clip-path", "url(#clip)");

xy_plane.x = d3.scaleLinear()
  .domain([N, 0])
  .range([xy_plane.width, 0]);

xy_plane.y = d3.scaleLinear()
  .domain([M, 0])
  .range([0, xy_plane.height]);

xy_plane.xAxis = d3.axisBottom(xy_plane.x); //.ticks(null, ".1f");
xy_plane.gX = graph.main_g.append("g")
  .attr("class", "axis axis--x")
  .call(xy_plane.xAxis)
  .attr("transform", "translate(0," + xy_plane.height + ")");

xy_plane.yAxis = d3.axisLeft(xy_plane.y); //.ticks(null, ".1f");
xy_plane.gY = graph.main_g.append("g")
  .attr("class", "axis axis--y")
  .call(xy_plane.yAxis)
//.attr("transform", "translate(" + graph.margins.left + ",0)");

xy_plane.plot = function() {
  xy_plane.spc_path = graph.data_g
    .append("g")
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
    .attr("id", "peaks");

  update_peaks(peaks)
}

xy_plane.plot();

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

function zoomed(axis) {
  getZoomedScales(axis);
  // updateGraph();
}

function update_peaks(pks) {

  let ms = 5;

  var sele = d3.select("#peaks")
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
  d3.select("#peaks")
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

  d3.select("#peaks")
    .selectAll("text").each(function(d, i) {
      var sel = d3.select(this);
      let x = xy_plane.x(d.x) * xy_plane.spc_path.mtx.kx + xy_plane.spc_path.mtx.tx + 5,
        y = xy_plane.y(d.y) * xy_plane.spc_path.mtx.ky + xy_plane.spc_path.mtx.ty - 5;

      console.log(d, x, y)

      sel.attr("x", x);
      sel.attr("y", y);
    })
}

function getZoomedScales(axis) {
  // update_peaks([]);

  if (axis == "x") {
    var tX = d3.zoomTransform(graph.overlayX.node());
    xy_plane.gX.call(xy_plane.xAxis.scale(tX.rescaleX(xy_plane.x)));

    // var t_matrix = "matrix(" + tX.k + ",0,0,1," + tX.x + ",0)";
    // console.log(t_matrix);
    // console.log(xy_plane.spc_path.attr("transform"));

    xy_plane.spc_path.mtx.kx = tX.k;
    xy_plane.spc_path.mtx.tx = tX.x;

    var t_matrix = "matrix(" + xy_plane.spc_path.mtx.kx + ",0,0," + xy_plane.spc_path.mtx.ky + "," +
      xy_plane.spc_path.mtx.tx + "," + xy_plane.spc_path.mtx.ty + ")";

    xy_plane.spc_path.attr("transform", t_matrix);

    // update_peaks(peaks);
    up_peaks();

  }
  if (axis == "y") {
    var tY = d3.zoomTransform(graph.overlayY.node());
    xy_plane.gY.call(xy_plane.yAxis.scale(tY.rescaleY(xy_plane.y)));

    xy_plane.spc_path.mtx.ky = tY.k;
    xy_plane.spc_path.mtx.ty = tY.y;

    var t_matrix = "matrix(" + xy_plane.spc_path.mtx.kx + ",0,0," + xy_plane.spc_path.mtx.ky + "," +
      xy_plane.spc_path.mtx.tx + "," + xy_plane.spc_path.mtx.ty + ")";

    // update_peaks(peaks);
    up_peaks()

    // var trx = "translate(" + -xy_plane.spc_path.mtx.tx + "," + -xy_plane.spc_path.mtx.ty + ")";
    // // console.log(trx)
    // xy_plane.peaks.attr("transform", trx);
    // xy_plane.peak_labels.attr("transform", trx);

    // xy_plane.spc_path.attr("transform", t_matrix);
    // xy_plane.peaks.attr("transform", t_matrix);
    // xy_plane.peak_labels.attr("transform", t_matrix);
  }
}

function rectZoom() {
  var element = this;
  var mouseOrigin = d3.mouse(element);
  var rect = graph.main_g.append("rect")
    .attr("fill", "rgba(255, 255, 0, 0.8)")
    .attr("stroke", "red");

  mouseOrigin[0] = Math.max(0, Math.min(xy_plane.width, mouseOrigin[0]));
  mouseOrigin[1] = Math.max(0, Math.min(xy_plane.height, mouseOrigin[1]));

  d3.select(window)
    .on("mousemove.zoomRect", function(d, i) {
      // console.log("d,i", d, i)
      let m = d3.mouse(element);

      m[0] = Math.max(0, Math.min(xy_plane.width, m[0]));
      m[1] = Math.max(0, Math.min(xy_plane.height, m[1]));

      rect.attr("x", Math.min(mouseOrigin[0], m[0]))
        .attr("y", Math.min(mouseOrigin[1], m[1]))
        .attr("width", Math.abs(m[0] - mouseOrigin[0]))
        .attr("height", Math.abs(m[1] - mouseOrigin[1]));
    })
    .on("mouseup.zoomRect", function() {
      d3.select(window)
        .on("mousemove.zoomRect", null)
        .on("mouseup.zoomRect", null);

      var m = d3.mouse(element);

      m[0] = Math.max(0, Math.min(xy_plane.width, m[0]));
      m[1] = Math.max(0, Math.min(xy_plane.height, m[1]));

      if (m[0] !== mouseOrigin[0] && m[1] !== mouseOrigin[1]) {
        console.log(mouseOrigin, m)
        // console.log(xy_plane.x.invert(mouseOrigin[0]), xy_plane.y.invert(mouseOrigin[1]))
        // console.log(xy_plane.x.invert(m[0]), xy_plane.y.invert(m[1]))

        var zoomRectWidth = Math.abs(m[0] - mouseOrigin[0]);
        var scaleFactor = xy_plane.width / zoomRectWidth;

        var e = graph.overlayX; //graph.overlayX;
        var t = d3.zoomTransform(e.node());
        var k = t.k;
        var x = t.x;
        var translateX = Math.min(m[0], mouseOrigin[0]);

        console.log(translateX, scaleFactor)
        console.log(x, k)

        e.transition()
          // .duration(750)
          .call(graph.zoomX.transform, d3.zoomIdentity
            .scale(scaleFactor)
            .translate(-translateX, 0)
            .translate(x, 0)
            .scale(k)
          );

        var zoomRectHeight = Math.abs(m[1] - mouseOrigin[1]);
        var scaleFactor = xy_plane.height / zoomRectHeight;

        var e = graph.overlayY;
        var t = d3.zoomTransform(e.node());
        var k = t.k;
        var y = t.y;
        var translateY = Math.min(m[1], mouseOrigin[1]);

        e.transition()
          // .duration(750)
          .call(graph.zoomY.transform, d3.zoomIdentity
            .scale(scaleFactor)
            .translate(0, -translateY)
            .translate(0, y)
            .scale(k)
          );
      }
      rect.remove();
    }, true);

  d3.event.stopPropagation();
}

function resetZoom() {
  graph.overlayX
    .transition()
    .duration(100)
    .call(graph.zoomX.transform, d3.zoomIdentity);

  graph.overlayY
    .transition()
    .duration(100)
    .call(graph.zoomY.transform, d3.zoomIdentity);

  getZoomedScales("x");
  getZoomedScales("y");
}
