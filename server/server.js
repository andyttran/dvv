var express = require('express');
var app = express();
//create server
var server = require('http').createServer(app);
//create the socket.io instance attached to the express instance
var io = require('socket.io')(server);
var port = process.env.PORT || 8000;

var favicon = require('serve-favicon');

// make server listen to port!
server.listen(port, function() {
  console.log('Server listening on port ' + port);
});

//tell express where to serve static files from
app.use(express.static(__dirname + '/../client'));

//tell express where to find the favicon
// app.use(favicon(__dirname + '/../client/assets/favicon.ico'));

app.get('/', function(req, res){
	res.render('index');
});

// app.get('/getData', function(req, res){
// 	res.send('hey guys');
// });

var createMatrixArrays = function(matrixSize, arrayLength){
  var randomArray = function(n){
    var result = [];
    for(var i = 0; i < n ; i++){
      var row = [];
      for (var j = 0; j < n; j++){
        row.push(Math.floor(Math.random()*100));
      }
      result.push(row);
    }
    return result;
  };

  var result = [];
  for(var i = 0; i < arrayLength; i++){
    result.push(randomArray(matrixSize));
  }
  return result;
};

var availableClients = [];
var partitionedData = createMatrixArrays(100, 10);
//var partitionedData = [1,2,3];
var i = 0;
var completedData = [];
var flag = true;
io.of('/').on('connection', function(socket){
	socket.join('slave');
  if(flag){
		console.time('timer');
		flag = false;
	}

	console.log('new connection');
	availableClients.push(socket);
  io.emit('clientChange', { 
    availableClients : availableClients.length 
  });

  socket.on('ready', function() {
    console.log('Client Ready');
    if (i < partitionedData.length) {
      socket.emit('data', {
        chunk : partitionedData[i++]
     });
    }
  });

	socket.on('completed', function(data){
    completedData.push(data);
    io.emit('progress', { 
      progress : completedData.length / partitionedData.length
    });
		if (completedData.length === partitionedData.length ){
      console.log("COMPUTATION COMPLETE")
			console.timeEnd('timer');
		} else {
      socket.emit('data',{
        chunk: partitionedData[i++]
      });
    }
	});

	socket.on('disconnect', function(){
		availableClients.splice(availableClients.indexOf(socket), 1);
    socket.broadcast.to('slave').emit('clientChange', { 
      availableClients : availableClients.length 
    });
	});
});