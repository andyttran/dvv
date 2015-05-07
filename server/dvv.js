
var dvv = function(){

  var express = require('express');
  var http = require('http');
  var favicon = require('serve-favicon');
  
  //TODO: include MinHeap.js in same file
  var minHeap = require('./MinHeap.js');

  //Global variables
  var STATIC_PATH = '/';
  //var FAVICON_PATH = '/favicon.ico';
  var DEFAULT_PORT = 8000;
  //TODO: have this interval change based on partition function parameters
  //Timer interval for fault tolerance, can be adjusted or made non constant
  var TIMEOUT_INTERVAL = 5000;

  //Default sample parallel process
  var FUNC= 'function(value){ return value; }';
  var PARTITION = [1, 2, 3];
  var CALLBACK = function(results){
    console.log(results);
  };
  var CLOCK = false;

}

dvv.prototype.init = function(){
  //Create server
  var app = express();
  var server = http.createServer(app);

  //Create the socket.io instance attached to the express instance
  var io = require('socket.io')(server);
  var port = process.env.PORT || DEFAULT_PORT;
  
  // Start the server
  server.listen(port, function() {
    console.log('Server listening on port ' + port);
  });
  
  //Tell express where to serve static files from
  app.use(express.static(__dirname + STATIC_PATH));

  //TODO: tell express where to find the favicon
  //app.use(favicon(__dirname + STATIC_PATH));

  //define routes
  app.get('/', function(req, res){
  res.render('index');
  });
};


dvv.prototype.config = function(params){

  //TODO: test for correct input params before setting
  params.hasOwnProperty(staticPath) &&  STATIC_PATH = params.staticPath;
  //params.hasOwnProperty(faviconPath) &&  FAVICON_PATH = params.faviconPath;
  params.hasOwnProperty(port) &&  DEFAULT_PORT = params.port;
  params.hasOwnProperty(timeout) &&  TIMEOUT_INTERVAL = params.timeout;

  //TODO: set the function parameters in case they input a native function i.e., 'map'
  params.hasOwnProperty(func) && FUNC = params.func;
  params.hasOwnProperty(parition) && PARTITION = params.partition;
  params.hasOwnProperty(callback) && CALLBACK = params.callback;
  params.hasOwnProperty(clock) && CLOCK = params.clock;

};

dvv.prototype.connect = function(){

  //Initialize all required data structures
  var availableClients = [];
  var unsentPackets = new minHeap();
  var pendingPackets = {};
  var completedPackets = new minHeap();

  //Copy operation data from dvv object
  var partitionedData = this.partition;
  var func = this.func;
  var callback = this.callback;
  var clock = this.clock;

  //Insert partitioned data into the unsent heap
  initializeProcess(partitionedData);
  
  io.of('/').on('connection', function(socket){
    //This kicks off timer for internal testing purposes
    if(timer){
      console.time('timer');
    }

    console.log('New Connection');
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

      if (completedPackets.size() === partitionedData.length){
        console.log("Computation Complete");

        if(timer){
          console.timeEnd('timer');
        }
        var finishedResults = [];

        //Integration of all the resulting data using heapsort
        while(completedPackets.size() > 0){
          finishedResults.push(completedPackets.getMin().result);
        }

        //Set callback funcrion using dvv.config to perform operations on the finished results
        callback(finishedResults);
        
        /*
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
      //Remove socket from the list of available clients
      availableClients.splice(availableClients.indexOf(socket), 1);
      //Notify everyone that client left
      socket.broadcast.emit('clientChange', { 
        availableClients : availableClients.length 
      });
    });
  });
}

//Utility functions
//Insert the partitioned data into the unsentPackets heap
var initializeProcess = function(partitionedData){
  var counter = 0;
  partitionedData.forEach(function(element){
    var packet = {'id': counter++, 'payload': element};
    unsentPackets.insert(packet);
  });
}

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

//This creates a timer of that will check whether the package
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

module.exports = dvv;
