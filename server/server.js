var dvv = require('./dvv.js');
var nqueens = require('./nqueens-bitwise.js')(17);

//Parameters to run a parallelized bitwise n-queens for a 17 by 17 board.
dvv.config({
 staticPath: '/../client',
 timeout: 70000,
 partitionLength: 0,
 data: nqueens.data,
 func: nqueens.func,
 callback: nqueens.callback,
 clock: true
});

dvv.start();