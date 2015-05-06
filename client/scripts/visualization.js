
var width = window.innerWidth,
    height = window.innerHeight;

var fill = d3.scale.category20();

var force = d3.layout.force()
    .size([width, height])
    .nodes([{}]) // initialize with a single node
    .charge(75)
    .gravity(.1)
    .on("tick", tick);

var svg = d3.select(".wrapper").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("mousemove", mousemove)
    .on("mousedown", mousedown);

svg.append("rect")
    .attr("width", width)
    .attr("height", height);

var nodes = force.nodes(),
  //  links = force.links(),
    node = svg.selectAll(".node"),
    link = svg.selectAll(".link");

var cursor = svg.append("circle")
    .attr("r", 30)
    .attr("transform", "translate(-100,-100)")
    .attr("class", "cursor");

restart();

function mousemove() {
  cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
}

function mousedown() {
  var point = d3.mouse(this),
      node = {x: point[0], y: point[1]},
      n = nodes.push(node);

  // add links to any nearby nodes
  // nodes.forEach(function(target) {
  //   var x = target.x - node.x,
  //       y = target.y - node.y;
  //   if (Math.sqrt(x * x + y * y) < 30) {
  //     links.push({source: node, target: target});
  //   }
  // });

  restart();
}

function tick() {
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function restart() {
  // link = link.data(links);

  // link.enter().insert("line", ".node")
  //     .attr("class", "link");

  node = node.data(nodes);

  node.enter().insert("circle", ".cursor")
      .attr("class", "node")
      .attr("r", 5)
      .call(force.drag);

  force.start();
}

d3.timer(restart);


// var updateConnected = function(n){
//   connected = n;
//   d3.select('.connectedCounter span').text(connected);

//   var point = d3.mouse(this),
//     node = {x: point[0], y: point[1]},
//     n = nodes.push(node);

//     console.log(point);

//   // add links to any nearby nodes
//   nodes.forEach(function(target) {
//     var x = target.x - node.x,
//         y = target.y - node.y;
//     if (Math.sqrt(x * x + y * y) < 30) {
//       links.push({source: node, target: target});
//     }
//   });

//   restart();
// }
/* var settings ={
  w: window.innerWidth,
  h: window.innerHeight,
  r: 10,

};

var center = { x: settings.w/2, y: settings.h/2 };
var connected =1;

var pixelize = function(number){ return number + 'px'; }

var rand  = function(n){ return Math.floor( Math.random() * n ); };
var randX = function(){ return pixelize( rand(center.x-settings.r*2) ) };
var randY = function(){ return pixelize( rand(center.y-settings.r*2) ) };

var updateConnected = function(n){
  connected = n;
  d3.select('.connectedCounter span').text(connected);
  update(connected);
}

var vis = d3.select('.visualization').style({
  width:  pixelize(settings.w),
  height: pixelize(settings.h)
});



var update = function(count) {
  var electrons = vis.selectAll('.electron')
    .data(d3.range(count))

  electrons.enter().append('div')
    .attr('class', 'electron')
    .style({
      top: randY,
      left: randX,
      width: pixelize( settings.r*2 ),
      height: pixelize( settings.r*2 )
    });

    electrons.exit().remove();
}


update(connected); */

