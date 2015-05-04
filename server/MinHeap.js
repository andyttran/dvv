var MinHeap = function(){
	this.storage = [];
	this.storage.push(null);
};

MinHeap.prototype.size = function(){
	//Taking into account the null element we pushed
	return this.storage.length - 1;
};

MinHeap.prototype.isEmpty = function(){
	return this.size() === 0;
};

MinHeap.prototype.insert = function(value){
	this.storage.push(value);
	this.bubbleUp(this.storage.length - 1);
};

MinHeap.prototype.getMin = function(){
	// Store the first element so we can return it later.
    var min = this.storage[1];
    // Get the element at the end of the array.
    var end = this.storage.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.storage.length > 1) {
      this.storage[1] = end;
      this.sinkDown(1);
    }
    return min;
};

MinHeap.prototype.bubbleUp = function(n){
	 // Fetch the element that has to be moved.
    var element = this.storage[n];
    // When at 0, an element can not go up any further.
    while (n > 1) {
      // Compute the parent element's index, and fetch it.
      var parentN = Math.floor(n/2);
      var parent = this.storage[parentN];
      // If the parent has a lesser score, things are in order and we
      // are done.
      if (element.id >= parent.id){
        break;
      }
      // Otherwise, swap the parent with the current element and
      // continue.
      this.storage[parentN] = element;
      this.storage[n] = parent;
      n = parentN;
    }
};

MinHeap.prototype.sinkDown = function(n){
	// Look up the target element and its score.
    var length = this.storage.length;
    var element = this.storage[n];

    while(true) {
      // Compute the indices of the child elements.
      var child1N = n * 2;
      var child2N = child1N + 1;
      // This is used to store the new position of the element,
      // if any.
      var swap = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.storage[child1N];
        // If the score is less than our element's, we need to swap.
        if (child1.id < element.id)
          swap = child1N;
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.storage[child2N];
        if (child2.id < (swap == null ? element.id : child1.id))
          swap = child2N;
      }

      // No need to swap further, we are done.
      if (swap == null) break;

      // Otherwise, swap and continue.
      this.storage[n] = this.storage[swap];
      this.storage[swap] = element;
      n = swap;
    }
  };

module.exports = MinHeap;
  //TODO: adapt into test cases
// var heap = new MinHeap();
// [{'id': 10}, {'id': 3}, {'id': 4}, {'id': 8}, {'id': 2}, {'id': 9}, {'id': 7}, {'id': 1}, {'id': 2}, {'id': 6}, {'id': 5}].forEach(function(element){
// 	heap.insert(element);
// 	console.log(heap.storage);
// });
// while (heap.size() > 0){
//   console.log(heap.getMin(), heap.isEmpty(), heap.size());
// }