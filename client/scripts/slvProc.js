
var socket = io.connect();

var process = function(data, cb){
  cb(data, function(result){
    console.log("SENDING: ", result);
    socket.emit('completed', {
      "result":result
    });
  });
}

var doubler = function(data, cb) {
  cb(data * 2);
};

socket.on('data', function(data) {
  console.log("ON DATA: ", data);
  process(JSON.stringify(data), doubler);
});




