var express = require('express');
var app = express();
//create server
var server = require('http').createServer(app);
//create the socket.io instance attached to the express instance
var io = require('socket.io')(server);
var port = process.env.PORT || 8000;

var favicon = require('serve-favicon');

// make server listen to port!
server.listen(port, function() {
  console.log('Server listening on port ' + port);
});

//tell express where to serve static files from
app.use(express.static(__dirname + '/../client'));

//tell express where to find the favicon
// app.use(favicon(__dirname + '/../client/assets/favicon.ico'));

app.get('/', function(req, res){
	res.render('index');
});