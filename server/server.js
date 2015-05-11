var dvv = require('./dvv.js');

//Function to create arrays for testing purposes
var createMatrixArrays = function(matrixSize, arrayLength){
  var randomArray = function(n){
    var result = [];
    for(var i = 0; i < n ; i++){
      var row = [];
      for (var j = 0; j < n; j++){
        row.push(Math.floor(Math.random()*100));
      }
      result.push(row);
    }
    return result;
  };

  var result = [];
  for(var i = 0; i < arrayLength; i++){
    result.push(randomArray(matrixSize));
  }
  return result;
};

// //Test : invert a matrix using math.js's math.inv function imported on client side
// //partitionLength is set to 1 by default
dvv.config({
 staticPath: '/../client',
 timeout: 25000,
 data: createMatrixArrays(200, 20),
 func: 'math.inv',
 clock: true
});

dvv.start();