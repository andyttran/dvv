
var connectedClients;
var socket;
var func;

var NUMBER_OF_WORKERS = 1;

var ON_DATA = function(data){
  console.log(data);
}
var ON_READY = function(){
  console.log("Ready");
}
var ON_PROGRESS = function(data){
  console.log(data);
}
var ON_END_PROGRESS = function(){
  console.log("Computation Complete, assembling results...");
}

var ON_RESULTS = function(results){
  console.log(results);
}

var dvvClientConfig = function(params){
  if('onData' in params){
    ON_DATA = params.onData;
  }

  if('onReady' in params){
    ON_READY = params.onReady;
  }

  if('onProgress' in params){
    ON_PROGRESS = params.onProgress;
  }

  if('onEndProgress' in params){
    ON_END_PROGRESS = params.onEndProgress;
  }

  if('onResults' in params){
    ON_RESULTS = params.onResults;
  }

  if ('numberOfWorkers' in params){
    NUMBER_OF_WORKERS = params.numberOfWorkers;
  }
}


//Upon button press, this function notifies the master
//it is ready to start
var clientRdy = function(btn){
  btn.innerHTML = 'Computing';
  // emit 3 ready events to the server
  for(var i=0; i < NUMBER_OF_WORKERS; i++) {
    socket.emit('ready');
  }
  ON_READY();
}


var dvvClientStart = function(){
  connectedClients = 0;
  socket = io.connect();
  //Predefined function just returns the element
  func = 'element';

  //Upon receiving data, process it
  socket.on('data', function(data) {

    ON_DATA(data);

    //Save function if a function was passed in
    if (data.fn){
      func = data.fn;
    }
    
    //Spawn a new webworker
    var worker = new Worker('scripts/workerTask.js');

    //Have our slave process listen to when web worker finishes computation
    worker.addEventListener('message', function(e) {
      console.log ("Worker has finished computing");
      //Send the results if successful
      socket.emit('completed', {
        "id": data.id,
        "result": e.data
      });
      //Kill the worker
      worker.terminate();
    }, false);

    //Have our slave process listen to errors from web worker
    worker.addEventListener('error', function(e){
      console.log("Worker has encountered an error with computation");
      //Send an error message back to master process
      socket.emit('completed', {
        "id": -1,
        "result": null
      });
      worker.terminate();
    }, false);

    //Send data to our worker
    worker.postMessage({fn: func, payload: data.payload});

  });

  // Receives progress info from server and visualizes it.
  socket.on('progress', function(data) {
    ON_PROGRESS(data.progress);

    // Displays complete animation
    if (data.progress >= 1) {
      ON_END_PROGRESS();
      document.getElementById("rdy").innerHTML = 'Complete';
    }
  });

  socket.on('complete', function(data){
    ON_RESULTS(data.results);
  });

  // Receives connected client info from server and visualizes it
  socket.on('clientChange', function(data) {
    connectedClients = data.availableClients ;
    updateConnected(connectedClients);
  });
}