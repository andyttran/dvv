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

//Test 1 : default test case
dvv.config({
  staticPath: '/../client',
  timeout: 10000,
  clock: true
});

// //Test 2: invert a matrix using math.js's math.inv function imported on client side
// //partitionLength is set to 1 by default
// dvv.config({
//  staticPath: '/../client',
//  timeout: 10000,
//  partition: createMatrixArrays(10, 10),
//  func: 'math.inv',
//  clock: true
// });

// //Test 3: nqueens solution
// nqueens = require('./nqueens.js')(15);
// //PartitionLength must be set to 0 for functions that require more than 1 argument
// //Also each partition must be in its own array
// dvv.config({
//  staticPath: '/../client',
//  timeout: 30000,
//  partition: nqueens.partition,
//  partitionLength: 0,
//  func: nqueens.func,
//  callback: nqueens.callback,
//  clock: true
// });

dvv.start();


