var width = 280;
var height = 500;
d3.selectAll("div")
  .style("width", width)
  .style("height", height);

var svg = d3.select("#generated svg")
  .attr("width", "100%")
  .attr("height", "100%");

d3.xml("data/thailand-color.svg").mimeType("image/svg+xml").get(function(error, xml) {
  if (error) throw error;

  document.getElementById("reference").appendChild(xml.documentElement);
  d3.select("#reference svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("opacity", 0.3);
});

d3.request("data/thailand-color.tiff").responseType("arraybuffer").get(function(error, request) {
  if (error) throw error;

  var tiff = GeoTIFF.parse(request.response);
  var image = tiff.getImage();
  var rgba = image.readRasters();
  var threshold = function(value) {
    return (value < 128)? 0:1;
  }
  var values = rgba[0].map(function(r, i) {
    return threshold(r)*4 + threshold(rgba[1][i])*2 + threshold(rgba[2][i])
  });
  var m = image.getHeight();
  var n = image.getWidth();

  // downsampling values
  var downsamplingRatio = 3 * Math.ceil(n / width); // must be int
  var downsamplingWidth = Math.ceil(n / downsamplingRatio);
  var downsamplingHeight = Math.ceil(m / downsamplingRatio);
  var values2 = [];
  for (var j = 0; j < m; j += downsamplingRatio) {
    for (var i = 0; i < n; i += downsamplingRatio) {
      values2.push(values[i + n*j]);
    }
  }

  var color = d3.scaleOrdinal(["white"].concat(d3.schemePastel2)) //d3.scaleSequential(d3.interpolateMagma)
    .domain(d3.extent(values));

  var contours = d3.contours()
      .size([downsamplingWidth, downsamplingHeight])
      .smooth(false)
      .thresholds(80);

  svg.selectAll("path")
    .data(contours(values2))
    .enter().append("path")
      .attr("d", d3.geoPath(d3.geoIdentity().scale(width / downsamplingWidth)))
      .attr("fill", function(d) { return color(Math.round(d.value)); });
});
