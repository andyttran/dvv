//require dependencies
var express = require('express'),
  http = require('http'),
  favicon = require('serve-favicon');

//create express instance
var app = express();

//used to render static files
app.use(express.static(__dirname + '/'));

//TODO: not yet done, used to render favicon 
app.use(favicon(__dirname + '/assets/favicon.ico'));

var port = process.env.PORT || 8000;

app.get('/', function(req, res){
	res.render('index');
});

// start up the server!
var server = http.createServer(app).listen(port, function() {
  console.log('Server listening on port ' + port);
});