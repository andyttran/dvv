
// on 
// on data

var socket = io.connect();

var process = function(data, cb){
  cb(data, function(result){
    socket.emit('completed', {
      "result":result
    });
  });
}

var doubler = function(data, cb) {
  var res = [];
  data.forEach(function(val) {
    res.push(val*2);
  });
  cb(res);
};

socket.on('data', function(data) {
  process(JSON.stringify(data), doubler);
});







