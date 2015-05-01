
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
  var result = math.inv(data.chunk);
  socket.emit('completed', {
  	"result": result
  });
});

socket.on('clientChange', function(data) {
  connectedClients = data.availableClients;
  console.log("Clients: ",connectedClients)
});




