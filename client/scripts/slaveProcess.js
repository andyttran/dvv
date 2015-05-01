
var xhrSuccess = function() {
  if (this.readyState === 4) {
    if (this.status === 200) {
      console.log("RESPONSE TEXT: ", this.responseText);
      this.callback(JSON.parse(this.responseText));
    } else {
      console.error(this.statusText);
    }
  }
};

var xhrError = function() {
  console.error(this.statusText);
};

var loadChunk = function(url, callback, timeout) {
  var oReq = new XMLHttpRequest();
  oReq.callback = callback;
  oReq.ontimeout = function () {
    console.error("The request for " + url + " timed out.");
  };
  oReq.onload = xhrSuccess;
  oReq.onerror = xhrError;
  oReq.open("get", url, true);
  oReq.timeout = timeout;
  oReq.send(null);
};

var outputMsg = function(data) {
  console.log("JSON inside callback ", data);
};

var getData = function(){
  loadChunk("/getData", outputMsg, 5000);
};


