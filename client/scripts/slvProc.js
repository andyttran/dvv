
var connectedClients = 0;
var socket = io.connect();

var asyncprocess = function(data, cb){
  cb(data, function(result){
    socket.emit('completed', {
      "result":result
    });
  });
};

// var doubler = function(data, cb) {
//   cb(data * 2);
// };

socket.on('data', function(data) {
  console.log("data");
  var result = math.inv(data.chunk);
  console.log ("results done");
  socket.emit('completed', {
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

var clientRdy = function(){
  socket.emit('ready');
}

socket.on('complete', function(){
  console.log("COMPLETE");
});




