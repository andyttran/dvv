var width = window.innerWidth,
    height = window.innerHeight;

var fill = d3.scale.category20();

var force = d3.layout.force()
    .size([width, height])
    .chargeDistance(1000)
    .theta(0.5)
    .on("tick", tick);

var svg = d3.select(".wrapper").append("svg")
    .attr("width", width)
    .attr("height", height);

var nodes = force.nodes(),
    node = svg.selectAll(".node");

restart();


function tick() {
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function restart() {
  node = node.data(nodes);

  node.enter().insert("circle")
    .attr("class", "node")
    .attr("r", 5)
    .attr('fill', '#E1499A')
    .attr('fill-opacity', 1)
    .attr('stroke', '#E1499A')
    .attr('stroke-width', 10)
    .attr('stroke-opacity', .5);
  
  node.exit().remove();

  force.start();

}

var updateConnected = function(n){
  d3.select('.connectedCounter span').text(n);
  var sparks = n*50;

  if (sparks > nodes.length){
    while (sparks !== nodes.length) {
      nodes.push({});
    }
  } else if (sparks < nodes.length) {
    while (sparks !== nodes.length) {
      nodes.pop();
    }
  }

}

var startAnim = function(){
  force.charge(100)
  .gravity(.2)
  .friction(1)
}

var stopAnim = function(){
  force.charge(0)
    .gravity(1)
    .friction(0)

    svg.select(".node")
      .transition()
      .duration(1000)
      .ease(Math.sqrt)
      .attr("r", 2000)
      .attr('fill', 'none')
      .style("stroke-opacity", 1e-6)
      .remove();

 svg.style('background-color', 'white');
 svg.transition().style('background-color', 'black').delay(1).duration(500);
}

d3.timer(restart);




