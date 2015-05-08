var express = require('express');
var http = require('http');
var favicon = require('serve-favicon');

//Initiate server variables in global scope
var server;
var io;

//Global variables
//Path to static files
var STATIC_PATH = '/';

////Path to favicon icon
//var FAVICON_PATH = '/favicon.ico';

//Timer interval for fault tolerance
var TIMEOUT_INTERVAL = 5000;

//Default distributed computing process
//Function for clients to compute
//Must be in form of a string with element as the an input parameter for the partition data
var FUNC = '(function(val){return val;}).apply(this, element)';

//Array of data to partition
var DATA = [1, 2, 3];

//Length of each partition
//Default set to 1
//For function requiring more than one input parameter, define each set of arguments in an 
//array and set PARTITION_LENGTH = 0
var PARTITION_LENGTH = 1;

//Callback to be made on complete of entire distributed task
var CALLBACK = function(results){ console.log(results); };

//Set a timer to measure the duration of entire distributed task
//For testing purposes
var CLOCK = false;

//Define export dvv object
var dvv = {};

//Configuration function takes in an object 'params' containing settings for distributed computing
dvv.config = function(params){
  //TODO: test for correct input params before setting
  if('staticPath' in params){
    STATIC_PATH = params.staticPath;
  }
  //params.hasOwnProperty(faviconPath) &&  FAVICON_PATH = params.faviconPath;
  if('timeout' in params){
    TIMEOUT_INTERVAL = params.timeout;
  }

  //TODO: account for preset functions such as 'map' or 'reduce'
  if('func' in params){
    FUNC = '(' + params.func + ').apply(this, element)';
  }

  if('data' in params){
    DATA = params.data;
  }

  if('partitionLength' in params){
    PARTITION_LENGTH = params.partitionLength;
  }

  if('callback' in params){
    CALLBACK = params.callback;
  }
  if('clock' in params){
    CLOCK = params.clock;
  }
};

dvv.start = function(){
  //Create server
  var app = express();
  server = http.createServer(app);

  //Create the socket.io instance attached to the express instance
  io = require('socket.io')(server);
  var port = process.env.PORT || 8000;
  
  //Start the server
  server.listen(port, function() {
    console.log('Server listening on port ' + port);
  });
  
  //Tell express where to serve static files from
  app.use(express.static(__dirname + STATIC_PATH));

  //TODO: tell express where to find the favicon
  //app.use(favicon(__dirname + STATIC_PATH));

  //Define routes
  app.get('/', function(req, res){
    res.render('index');
  });

  //Initialize all required data structures
  //Array of sockets of available clients
  var availableClients = [];

  //Collection of unsent packets prioritized using a min heap
  var unsentPackets = new MinHeap();

  //Collection of send packages that have not been completed
  //object keys are set to corresponding packet ids
  var pendingPackets = {};
  
  //Collection of completed packets prioritized using a min heap
  var completedPackets = new MinHeap();

  //Copy global variables
  var func = FUNC;
  var callback = CALLBACK;
  var clock = CLOCK;

  //Partition the data into increments based on PARTITION_LENGTH
  var partitionedData = [];

  //For use with functions that require multiple arguments
  if(PARTITION_LENGTH === 0){
    partitionedData = DATA;
  } else if (PARTITION_LENGTH > 0){

    //Divide data array into subarrays of specified length
    for(var i = 0; i < DATA.length; i += PARTITION_LENGTH){
      partitionedData.push(DATA.slice(i, Math.min(i + PARTITION_LENGTH, DATA.length)));
    }
  }

  //Insert partitioned data into the unsent heap
  initializeProcess(partitionedData);
  
  io.of('/').on('connection', function(socket){
    //This kicks off timer for internal testing purposes
    if(clock){
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

        if(clock){
          console.timeEnd('timer');
        }
        var finishedResults = [];

        //Integration of all the resulting data using heapsort
        while(completedPackets.size() > 0){
          finishedResults.push(completedPackets.getMin().result);
        }

        //Set callback funcrion using dvv.config to perform operations on the finished results
        callback(finishedResults);
        
        // //TODO: Move to documentation
        // partitionedData = partitionData(finishedResults);
        // resetProcess();
        // initializeProcess(partitionedData);
        // availableClients.forEach(function(socket){
        //   sendNextAvailablePacket(socket);
        // });
        
        io.emit('complete');
      } else {
        sendNextAvailablePacket(socket);
      }
    });

    socket.on('disconnect', function(){

      //Remove socket from the list of available clients
      availableClients.splice(availableClients.indexOf(socket), 1);

      //Notify everyone that a client left
      socket.broadcast.emit('clientChange', { 
        availableClients : availableClients.length 
      });
    });
  });

  //Utility functions
  //Insert the partitioned data into the unsentPackets heap
  function initializeProcess(partitionedData){
    var counter = 0;
    //Wraps each partitioned data into a packet with an id for tracking
    partitionedData.forEach(function(element){
      var packet = {'id': counter++, 'payload': element};
      unsentPackets.insert(packet);
    });
  }

  //Reset all data structures
  function resetProcess(){
    availableClients = [];
    unsentPackets = new MinHeap();
    pendingPackets = {};
    completedPackets = new MinHeap();
  }

  //Send the next available packet
  function sendNextAvailablePacket(socket){
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
  }

  //This creates a timer of that will check whether the package
  //is still pending. If it is, it will add it back to the unsent heap
  function createTimer(packetNumber){
    setTimeout(function(){
      if (pendingPackets[packetNumber]){
        console.log('packet number ' + packetNumber + ' is late!');
        var packet = {'id': packetNumber, 'payload': pendingPackets[packetNumber]};
        delete pendingPackets[packetNumber];
        unsentPackets.insert(packet);
      }
    }, TIMEOUT_INTERVAL, packetNumber);
  }
};


//Define minimum heap for storing partition data
var MinHeap = function(){
  this.storage = [];
  this.storage.push(null);
};

MinHeap.prototype.size = function(){
  //Taking into account the null element we pushed
  return this.storage.length - 1;
};

MinHeap.prototype.isEmpty = function(){
  return this.size() === 0;
};

MinHeap.prototype.insert = function(value){
  this.storage.push(value);
  this.bubbleUp(this.storage.length - 1);
};

MinHeap.prototype.getMin = function(){
  // Store the first element so we can return it later.
    var min = this.storage[1];
    // Get the element at the end of the array.
    var end = this.storage.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.storage.length > 1) {
      this.storage[1] = end;
      this.sinkDown(1);
    }
    return min;
};

MinHeap.prototype.bubbleUp = function(n){
   // Fetch the element that has to be moved.
    var element = this.storage[n];
    // When at 0, an element can not go up any further.
    while (n > 1) {
      // Compute the parent element's index, and fetch it.
      var parentN = Math.floor(n/2);
      var parent = this.storage[parentN];
      // If the parent has a lesser score, things are in order and we
      // are done.
      if (element.id >= parent.id){
        break;
      }
      // Otherwise, swap the parent with the current element and
      // continue.
      this.storage[parentN] = element;
      this.storage[n] = parent;
      n = parentN;
    }
};

MinHeap.prototype.sinkDown = function(n){
  // Look up the target element and its score.
    var length = this.storage.length;
    var element = this.storage[n];

    while(true) {
      // Compute the indices of the child elements.
      var child1N = n * 2;
      var child2N = child1N + 1;
      // This is used to store the new position of the element,
      // if any.
      var swap = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.storage[child1N];
        // If the score is less than our element's, we need to swap.
        if (child1.id < element.id)
          swap = child1N;
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.storage[child2N];
        if (child2.id < (swap === null ? element.id : child1.id)){
          swap = child2N;
        }
      }

      // No need to swap further, we are done.
      if (swap === null) {
        break;
      }

      // Otherwise, swap and continue.
      this.storage[n] = this.storage[swap];
      this.storage[swap] = element;
      n = swap;
    }
  };

module.exports = dvv;
