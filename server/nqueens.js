//An distributed computing version of nqueens solver
var nQueensParallel = function(n) {
  
  //Estimate total time in milliseconds based on trial runs
  var est = 4.9*Math.pow(10, -6)*Math.pow(2.71, 1.6*n);

  //Threshold for a partitioned slave computation is default set to between 5 and 60 seconds
  var lowerThreshold = 5000;
  var upperThreshold = 60000;

  //Number of rows needed to be defined for partition set
  var rows = 0;
  
  //Find optimal number of rows  
  while(est > upperThreshold){
    est /= n;
    if(est > lowerThreshold){ 
      rows++;
    }
  }

  var obj = {};

  //Create chucks to distribute to slaves
  obj.data = createPartition(n, rows);

  //Minified version of nQueensSolver function below
  obj.func = function Q(r,i){var n=0;if(void 0===r)return n;var a=function(r,f,t,v){v===i&&n++;for(var o=0;i>o;o++)if(!r[o]){var u=o-v,c=o+v;f[u]||t[c]||(f[u]=!0,t[c]=!0,r[o]=!0,v++,a(r,f,t,v),f[u]=!1,t[c]=!1,r[o]=!1,v--)}};return a.apply(this,r),n};

  //Callback function sums up all solutions found
  obj.callback = function(results){
    var solutions = results.reduce(function(sum, resultChunk){
      return sum + resultChunk;
    }, 0);
    console.log(solutions);
  };

  return obj;
};


//Un-minified version of dvvNQ.func for reference purposes
  //slave will run this for the chunk data provided
function nQueensSolver(initialize, n){
  
  var solution = 0;
  
  //Check if initial perameters have been inputed
  if(initialize === undefined){
    return solution;
  }

  //This nQueens solution uses objects for constant time lookup
    //key is an object that stores the columns that have a queen
    //majorKey is an object that stores the majorKey of added queens
    //minorKey is an object that stores the minorKey of added queens
    //length stores the amount of queens on the board
  var findQ = function(key, majorKey, minorKey, length){

    //A solution is found if length is equal to n
    if(length === n){ solution++; }

    for(var i = 0; i < n; i++){

      //Check if position has a unique column
      if(!key[i]){
        var majorValue = i - length;
        var minorValue = i + length;
        
        //Check if position has a unique major and minor key
        if(!majorKey[majorValue] && !minorKey[minorValue]){

          //A position with no conflicting row, column, major diagonal, and minor diagonal found
          majorKey[majorValue] = true;
          minorKey[minorValue] = true;
          key[i] = true;
          length++;

          //Recursively call helper function to find a solution
          findQ(key, majorKey, minorKey, length);

          //Reset object properties and length for next iteration
          // Avoid delete properties for faster operation
          majorKey[majorValue] = false;
          minorKey[minorValue] = false;
          key[i] = false;
          length--; 
        }
      }
    }
  };

  //Call internal helper function
  findQ.apply(this, initialize);

  return solution;
}


//This is used to get the partitioned chunks
  //if estimated computation time is less than threshold, does not partition and send out the default case starting case
  //e.g., dvv.partition[0] = [[{},{},{},0], n]
function createPartition(n, rows){
  var results = [];

  //Resursively iterate to find a valid a chunk
  var findValidChunk = function(key, majorKey, minorKey, length){
    if(length === rows){ 

      //Make a copy of the object and stores it into result
      return results.push(JSON.parse(JSON.stringify([[key, majorKey, minorKey, length], n])));
    }
    for(var i = 0; i < n; i++){
      
      //Check if position has a unique column
      if(!key[i]){
        var majorValue = i - length;
        var minorValue = i + length;

        //Check if position has a unique major and minor key
        if(!majorKey[majorValue] && !minorKey[minorValue]){

          //A position with no conflicting row, column, major diagonal, and minor diagonal found
          majorKey[majorValue] = true;
          minorKey[minorValue] = true;
          key[i] = true;
          length++;

          //Recursively call helper function to find a solution
          findValidChunk(key, majorKey, minorKey, length);

          //Reset object properties and length for next iteration
          //Delete keys to conserve space
          delete majorKey[majorValue];
          delete minorKey[minorValue];
          delete key[i];
          length--; 
        }
      }
    }
  };

  findValidChunk({},{},{},0);
  return results;
}

module.exports = nQueensParallel;