// dimensions of svg
var width = window.innerWidth,
    height = window.innerHeight;

// create force layout, with a single node to begin
var force = d3.layout.force()
    .size([width, height])
    .nodes([{}])
    .chargeDistance(1000)
    .theta(0.5)
    .on("tick", tick);

// append svg to wrapper
var svg = d3.select(".wrapper").append("svg")
    .attr("width", width)
    .attr("height", height);

var nodes = force.nodes(),
    node = svg.selectAll(".node");  

// restart force layout 
restart();

// update node position attributes on tick
function tick() {
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// new nodes enter, old ones removed, restart force layout
function restart() {
  node = node.data(nodes);

  node.enter().insert("circle")
    .attr("class", "node")
    .attr("r", 5)
    .attr('fill', '#FFF')
    .attr('fill-opacity', 1)
    .attr('stroke', '#E1499A')
    .attr('stroke-width', 10)
    .attr('stroke-opacity', .5);
 
  node.exit().remove();

  force.start();
}

// display connected clients to screen
var updateConnected = function(n){
  d3.select('.connectedCounter span').text(n);
}

// animated explosion when data is received
var onDataAnim = function(){
  // add another node
  nodes.push({});

  // animate one to explode!
  svg.select(".node")
      .transition()
      .duration(500)
      .ease("elastic")
      .delay(500)
      .attr("r", 1000)
      .transition()
      .duration(0)
      .attr("r", 5)
}

// Change force layout properties for "agitated" state animation
var startAnim = function(){
  force.charge(100)
  .gravity(.2)
  .friction(1)
}

// Change force layout properties for "resting" state animation
var stopAnim = function(){
  force.charge(0)
    .gravity(1)
    .friction(0)

  // make one node Explode!
  svg.select(".node")
    .transition()
    .duration(1000)
    .ease(Math.sqrt)
    .attr("r", 2000)
    .attr('fill', 'none')
    .style("stroke-opacity", 1e-6)
    .remove();

  // add glow animation to nodes
  svg.selectAll(".node")
    .attr("class", "flash-node")
    .attr("r", 15)
    .attr('stroke-width', 15);

 // Change background from black to white to pink
 svg.style('background-color', '#FFF');
 svg.transition().style('background-color', '#E1499A').delay(1).duration(500);
}

// agitate the system for contant movement
d3.timer(restart);




