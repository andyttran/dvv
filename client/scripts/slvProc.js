
var socket = io.connect();

var asyncprocess = function(data, cb){
  cb(data, function(result){
    console.log("SENDING: ", result);
    socket.emit('completed', {
      "result":result
    });
  });
};

var doubler = function(data, cb) {
  cb(data * 2);
};

socket.on('data', function(data) {
  console.log("ON DATA: ", data);
  // process(data.chunk, doubler);
  var result = math.inv(data.chunk);
  socket.emit('completed', {
  	"result": result
  });
});




