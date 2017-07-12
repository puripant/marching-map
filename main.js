d3.request("data/Thailand_provinces_mk-from-gif.tiff").responseType("arraybuffer").get(function(error, request) {
  if (error) throw error;

  var tiff = GeoTIFF.parse(request.response),
      image = tiff.getImage(),
      values = image.readRasters()[0],
      m = image.getHeight(),
      n = image.getWidth(),
      svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

  // downsampling values
  var downsamplingRatio = 20, // must be int
      downsamplingWidth = Math.ceil(n / downsamplingRatio);
      downsamplingHeight = Math.ceil(m / downsamplingRatio);
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
      .attr("fill", function(d) { return color(d.value); });
});