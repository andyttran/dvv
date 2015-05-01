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
  }

  var result = [];
  for(var i = 0; i < arrayLength; i++){
    result.push(randomArray(matrixSize));
  }
  return result;
};

var availableClients = [];
var partitionedData = createMatrixArrays(300, 10);
var i = 0;
var completedData = [];
var flag = true;
io.of('/').on('connection', function(socket){
	if(flag){
		console.time('andy');
		flag = false;
	}
	console.log('new connection');
	availableClients.push(socket);
	if (i < partitionedData.length){
		socket.emit('data', {
			chunk : partitionedData[i++]
		});
	}

	socket.on('completed', function(data){
		completedData.push(data);
		if (completedData.length === 10){
			console.timeEnd('andy');
		}
		if (i < partitionedData.length){
			socket.emit('data',{
				chunk: partitionedData[i++]
			})
		}
	});

	socket.on('disconnect', function(socket){
		availableClients.indexOf(socket)
	})
});