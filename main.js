var svg = d3.select("svg");
var width = +svg.attr("width");
var height = +svg.attr("height");

d3.xml("data/Thailand_provinces_mk.svg").mimeType("image/svg+xml").get(function(error, xml) {
  if (error) throw error;
  document.body.appendChild(xml.documentElement);
  d3.selectAll("svg")
    .attr("width", width)
    .attr("height", height);
});

d3.request("data/Thailand_provinces_mk-color.tiff").responseType("arraybuffer").get(function(error, request) {
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
  var downsamplingRatio = 6; // must be int
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
