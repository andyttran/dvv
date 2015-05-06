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

//Initialize all data structures we'll need
var availableClients = [];
var unsentPackets = new minHeap();
var pendingPackets = {};
var completedPackets = new minHeap();

//TODO: potentially get rid of this
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

//TODO: have this interval change based on partition function parameters
//Timer interval for fault tolerance, can be adjusted or made non constant
var TIMEOUT_INTERVAL = 5000;

//TODO: make this into a modular partition function
//Dummy data consisting of 10, 100 X 100 arrays
var partitionedData = createMatrixArrays(100, 10);
// var partitionedData = [1,2,3];

//TODO: will be moved to utilities functions
//Insert the partitioned data into the unsentPackets heap
var initializeProcess = function(partitionedData){
  var counter = 0;
  partitionedData.forEach(function(element){
    var packet = {'id': counter++, 'payload': element};
    unsentPackets.insert(packet);
  });
}

//Insert partitioned data into the unsent heap
initializeProcess(partitionedData);

//timer flag
var flag = true;

//TODO: let users define the function somehow, API like?
//We define the function as a string
var func = 'math.inv(element)';
// var func = 'element * 2';

io.of('/').on('connection', function(socket){
  //This kicks off our timer for internal testing purposes
  if(flag){
		console.time('Timer');
		flag = false;
	}

	console.log('new connection');
	availableClients.push(socket);

  //Notify everyone a new client has been added
  io.emit('clientChange', { 
    availableClients : availableClients.length 
  });

  //When client is ready, send them a packet
  socket.on('ready', function() {
    console.log('Client Ready');
    sendNextAvailablePacket(socket);
  });

  //When client has returned data, check validity and send 
  //another packet if necessary
	socket.on('completed', function(data){
    // console.log(data);

    //If the computation was completed successfully 
    //and it was delivered back in a timely fashion,
    //add it to the completed packets heap/ remove from pending packets
    //**NOTE: this implies late packages will be chucked aside
    if (data.id !== -1 && pendingPackets[data.id]){
      delete pendingPackets[data.id];
      completedPackets.insert(data);
      
      //Update everyone on the current progress
      //TODO: perhaps modify to do it only every once in a while
      //to avoid congestion
      io.emit('progress', { 
        progress : completedPackets.size() / partitionedData.length
      });
    }

		if (completedPackets.size() === partitionedData.length ){
      console.log("COMPUTATION COMPLETE");
			console.timeEnd('Timer');
      var finishedResults = [];
      //Integration of all the resulting data using heapsort
      while(completedPackets.size() > 0){
        finishedResults.push(completedPackets.getMin().result);
      }
      // console.log(finishedResults);

      /************************
      TODO: FURTHER CALCULATIONS MAY BE DONE HERE
      YOU CAN ALSO RESET THE PROCESS AND CHOOSE NOT
      TO EMIT COMPLETE HERE AS WELL
      Example implementation:

      partitionedData = partitionData(finishedResults);
      resetProcess();
      initializeProcess(partitionedData);
      availableClients.forEach(function(socket){
        sendNextAvailablePacket(socket);
      });

      */
      io.emit('complete');
		} else {
      sendNextAvailablePacket(socket);
    }
	});

	socket.on('disconnect', function(){
    console.log("dc");
    //Remove socket from the list of available clients
		availableClients.splice(availableClients.indexOf(socket), 1);
    //Notify everyone that someone left
    socket.broadcast.emit('clientChange', { 
      availableClients : availableClients.length 
    });
	});
});


//Utility functions TODO: can be all moved out if you wish

//Reset all data structures
var resetProcess = function(){
  availableClients = [];
  unsentPackets = new minHeap();
  pendingPackets = {};
  completedPackets = new minHeap();
}

//Send the next available packet
var sendNextAvailablePacket = function(socket){
  if (unsentPackets.size() > 0) {
    var nextPacket = unsentPackets.getMin();
    socket.emit('data', {
      fn: func,
      id: nextPacket.id,
      payload: nextPacket.payload
   });
    pendingPackets[nextPacket.id] = nextPacket.payload;
    createTimer(nextPacket.id);
  }
};

//This creates a timer of 5 seconds that will check whether the package
//is still pending. If it is, it will add it back to the unsent heap
var createTimer = function(packetNumber){
  setTimeout(function(){
    if (pendingPackets[packetNumber]){
      console.log('packet number ' + packetNumber + ' is late!');
      var packet = {'id': packetNumber, 'payload': pendingPackets[packetNumber]};
      delete pendingPackets[packetNumber];
      unsentPackets.insert(packet);
    }
  }, TIMEOUT_INTERVAL, packetNumber);
}
