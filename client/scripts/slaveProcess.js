
var connectedClients = 0;
var socket = io.connect();
//Predefined function just returns the element
var func = 'element';

var isAnimating = false;

//Upon button press, this function notifies the master
//it is ready to start
var clientRdy = function(btn){
  btn.innerHTML = 'Computing';
  // emit 3 ready events to the server
  socket.emit('ready');
  socket.emit('ready');
  socket.emit('ready');
  startAnim();
}


//Upon receiving data, process it
socket.on('data', function(data) {

  // animate the arrival of data with EXPLOSIONS!
  onDataAnim();
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
  updateProgress(data.progress);
  // Displays complete animation
  if (data.progress >= 1) {
    stopAnim();
    document.getElementById("rdy").innerHTML = 'Complete';
  }
});

// Receives connected client info from server and visualizes it
socket.on('clientChange', function(data) {
  connectedClients = data.availableClients ;
  updateConnected(connectedClients);
});

