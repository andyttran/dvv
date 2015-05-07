var Dvv = require('./dvv.js');
var dvv = new Dvv();

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

dvv.config({
  
  staticPath: '/../client'
  timeout: 10000;
  partition: createMatrixArrays(10, 10),
  func: 'math.inv(element)'
  timer: true

})
