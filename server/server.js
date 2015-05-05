var express = require('express');
var app = express();

//Create server
var server = require('http').createServer(app);

//Create the socket.io instance attached to the express instance
var io = require('socket.io')(server);
var port = process.env.PORT || 8000;

var favicon = require('serve-favicon');
var minHeap = require('./MinHeap.js');

// Start the server
server.listen(port, function() {
  console.log('Server listening on port ' + port);
});

//Tell express where to serve static files from
app.use(express.static(__dirname + '/../client'));

//TODO: tell express where to find the favicon
// app.use(favicon(__dirname + '/../client/assets/favicon.ico'));

app.get('/', function(req, res){
	res.render('index');
});

//Function to create arrays for testing purposes
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

//Initialize all data structures we'll need
var availableClients = [];
var unsentPackets = new minHeap();
var pendingPackets = {};
var completedPackets = new minHeap();

//Dummy data consisting of 10, 100 X 100 arrays
var partitionedData = createMatrixArrays(10, 10);
// var partitionedData = [1,2,3];

//Insert the data into the unsentPackets heap
var counter = 0;
partitionedData.forEach(function(element){
  var packet = {'id': counter++, 'payload': element};
  unsentPackets.insert(packet);
});

//timer flag
var flag = true;

//We define the function as a string
var func = 'math.inv(element)';
// var func = 'element * 2';

io.of('/').on('connection', function(socket){
  //This kicks off our timer for internal testing purposes
  if(flag){
		console.time('timer');
		flag = false;
	}

	console.log('new connection');
	availableClients.push(socket);

  //Notify everyone a new client has been added
  io.emit('clientChange', { 
    availableClients : availableClients.length 
  });

  socket.on('ready', function() {
    console.log('Client Ready');
    sendNextAvailablePacket(socket);
  });

	socket.on('completed', function(data){
    console.log(data);
    completedPackets.insert(data);

    //Update everyone on the current progress
    //TODO: perhaps modify to do it only every once in a while
    //to avoid congestion
    io.emit('progress', { 
      progress : completedPackets.size() / partitionedData.length
    });

		if (completedPackets.size() === partitionedData.length ){
      console.log("COMPUTATION COMPLETE");
			console.timeEnd('timer');
      var finishedResults = [];
      //Integration of all the resulting data using heapsort
      while(completedPackets.size() > 0){
        finishedResults.push(completedPackets.getMin().result);
      }
      console.log(finishedResults);

      /************************
      FURTHER CALCULATIONS MAY BE DONE HERE
      YOU CAN ALSO RESET THE PROCESS AND CHOOSE NOT
      TO EMIT COMPLETE HERE AS WELL
      */
      io.emit('complete');
		} else {
      sendNextAvailablePacket(socket);
    }
	});

	socket.on('disconnect', function(){
    //Remove socket from the list of available clients
		availableClients.splice(availableClients.indexOf(socket), 1);
    //Notify everyone that someone left
    socket.broadcast.emit('clientChange', { 
      availableClients : availableClients.length 
    });
	});
});


//Utility function TODO: can be moved out if you wish
var sendNextAvailablePacket = function(socket){
  if (unsentPackets.size() > 0) {
    var nextPacket = unsentPackets.getMin();
    socket.emit('data', {
      fn: func,
      id: nextPacket.id,
      payload: nextPacket.payload
   });
  }
};