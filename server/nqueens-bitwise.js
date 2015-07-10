//An distributed computing version of nqueens solver
var nQueensParallel = function(n) {
  
  //Estimate total time in milliseconds based on trial runs using exponential curve fit
  var est = 5*Math.pow(10, -8)*Math.pow(2.71, 1.7*n);

  //Threshold for a partitioned slave computation is default set to between 5 and 60 seconds
  var lowerThreshold = 5000;
  var upperThreshold = 60000;

  //Number of rows needed to be defined for partition set
  var rows = 0;
  
  //Find optimal number of rows  
  while(est > upperThreshold){
    est /= Math.ceil(n/2);
    if(est > lowerThreshold){ 
      rows++;
    }
  }

  var obj = {};

  //Create chucks to distribute to slaves
  obj.data = createPartition(n, rows);

  //Minified version of nQueensSolver function below
  obj.func = "function Q(r,e,f,i,n,a,o,t){for(var u=0,b=0,c=e-1;e>c;)if(0===o){if(c+1>=e)break;o=a[--e]}else r-1>e?(b=-o&o,o&=~b,f[e+1]=f[e]|b,n[e+1]=(n[e]|b)>>1,i[e+1]=(i[e]|b)<<1,a[e]=o,e++,o=t&~(f[e]|n[e]|i[e])):(u++,o=a[--e]);return u}"

  //Callback function sums up all solutions found
  obj.callback = function(results){
    console.log(results);
    var solution = results.reduce(function(sum, resultChunk){
      return sum + (2 * resultChunk);
    }, 0);
    console.log(solution);
  };

  return obj;
};


//Un-minified version for reference purposes
  //slave will run this for the chunk data provided
function Q(n, row, key, major, minor, stack, avail, full){
  var solution = 0; //initiate solution count;
  var next = 0; //least significant bit
  var rowBreak = row - 1; //compute row to break

  while(row > rowBreak){
    //if no more slots to try for a row
    //and the row is at 0, then end of while loop
    //otherwise reverse back the stack by one row
    if(avail === 0){
      if(row <= rowBreak + 1 ){ break; }
      avail = stack[--row]; //reverse state by one  
    } 
    else {
      if(row < n-1 ){
        //set lowest available spot to test
        next = -avail & avail;
        avail &= ~next; //toggle off this spot
        key[row+1] = key[row] | next;
        minor[row+1] = (minor[row] | next) >> 1;
        major[row+1] = (major[row] | next) << 1;
        stack[row] = avail;
        row++;
        avail = full & ~(key[row] | minor[row] | major[row]);
      } else {
        //push current state into data array
        solution++;
        avail = stack[--row];
      }
    }
  }
  return solution;
}


//This is used to get the partitioned chunks for bitwise solution
  //if estimated computation time is less than threshold, does not partition and send out the default case starting case
function createPartition(n, rows){

  if(rows === undefined){ rows = 0; }
  if(n < rows){ throw "Error: rows to partition is greater than n rows available" }
  var data = [];

  var key = new Uint32Array(n); //key
  var major = new Uint32Array(n); //major key
  var minor = new Uint32Array(n); //minor key
  var stack = new Uint32Array(n); //remembers the state of each row for rewinding
  var next = 0; //least significant bit
  var avail = 0; //available positions for a queen
  var odd = n & 1; //flag if odd or even
  var full = (1 << n) - 1; //field of 1's
  var row = 0; //signifies current row

  //perform operation twice if n is odd
  for(var i = 0; i < 1 + odd; i++){
    if(i === 0){
      //handle half the board first, ignore middle column if odd
      //set half the field to 1's
      avail = (1 << (n >> 1)) - 1;
    } else {
      //handle the middle column for odd rows
      avail = (1 << (n >> 1));
      key[1] = avail;
      major[1] = avail << 1;
      minor[1] = avail >> 1;
      row = 1;
      avail = (avail - 1) >> 1;
      //stack is already set at zero, no declaration required
    }

    //critical loop
    while(true){
      //if no more slots to try for a row
      //and the row is at 0, then end of while loop
      //otherwise reverse back the stack by one row
      if(avail === 0){
        if(row === 0){ break; }
        avail = stack[--row]; //reverse state by one  
      } 
      else {
        //set lowest available spot to test
        if(row < rows){
          next = -avail & avail;
          avail &= ~next; //toggle off this spot
          key[row+1] = key[row] | next;
          minor[row+1] = (minor[row] | next) >> 1;
          major[row+1] = (major[row] | next) << 1;
          stack[row] = avail;
          row++;
          avail = full & ~(key[row] | minor[row] | major[row]);
        } else {
          //push current state into data array
          data.push([n, row, Array.prototype.slice.apply(key), Array.prototype.slice.apply(major), Array.prototype.slice.apply(minor), Array.prototype.slice.apply(stack), avail, full]);
          if(rows === 0){
            break;
          }
          avail = stack[--row];
        }
      }
    }
  }
  return data;
}

module.exports = nQueensParallel;