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
  obj.func = "function Q(o,i,n,r,t,u,e,f,l){solution=0;for(var s=0;;)if(0===u){if(0===l)break;u=t[--l]}else s=-u&u,u&=~s,o-1>l?(i[l+1]=i[l]|s,r[l+1]=(r[l]|s)>>1,n[l+1]=(n[l]|s)<<1,t[l]=u,l++,u=f&~(i[l]|r[l]|n[l])):(solution++,u=t[--l]);return solution}"

  //Callback function sums up all solutions found
  obj.callback = function(results){
    var solution = results.reduce(function(sum, resultChunk){
      return sum + (2 * resultChunk);
    }, 0);
    console.log(solution);
  };

  return obj;
};


//Un-minified version for reference purposes
  //slave will run this for the chunk data provided
function Q(n, key, major, minor, stack, avail, odd, full, row){
  solution = 0;
  var next = 0; //least significant bit

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
      next = -avail & avail;
      avail &= ~next; //toggle off this spot
      if(row < n-1 ){
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


//This is used to get the partitioned chunks
  //if estimated computation time is less than threshold, does not partition and send out the default case starting case
function createPartition(n, rows){
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
    }

    if(rows ===0){

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
          data.push([n, key, major, minor, stack, avail, odd, full, row]);
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