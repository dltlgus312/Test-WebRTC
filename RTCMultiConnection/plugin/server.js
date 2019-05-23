var fs = require('fs');
var express = require( 'express' );
var app = express( );
var https = require('https');

var options = {
  pfx: fs.readFileSync('./keys/server.pfx'),
  passphrase: 'root'
};


// JS FILE LOAD
app.use("/node_modules", express.static(__dirname + "/node_modules"));


// HTTPS SERVER OPEN
https = https.Server( options, app );
https.listen(443, ( ) => {
	console.log("https open");
});


// URL FORWORDING
app.get('/', ( req, res ) => {
	res.sendfile( 'index.html' );
});

app.get('/getSourceId', ( req, res ) => {
	res.sendfile( 'getSourceId.html' );
});





