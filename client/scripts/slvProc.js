
var connectedClients = 0;
var socket = io.connect();
//Predefined function just returns the element
var func = 'element';

//Upon button press, this function notifies the master
//it is ready to start
var clientRdy = function(){
  socket.emit('ready');
}

socket.on('data', function(data) {
  console.log("data received");

  //TODO: WEB WORKER
  //Save function if a function was passed in
  if (data.fn){
    func = data.fn;
  }
  var element = data.payload;
  var result = eval(func);
  console.log ("results done");
  socket.emit('completed', {
    "id": data.id,
    "result": result
  });
});

socket.on('progress', function(data) {
  console.log(data.progress);
});

socket.on('clientChange', function(data) {
  connectedClients = data.availableClients;
  console.log("Clients: ",connectedClients)
});

socket.on('complete', function(){
  console.log("COMPLETE");
});
