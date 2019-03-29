var fs = require('fs');

const options = {
  pfx: fs.readFileSync('./keys/server.pfx'),
  passphrase: 'root'
};

var app = require( 'express' )(  );
var https = require('https').Server( options, app );
var io = require( 'socket.io' )( https );
const RTCMultiConnectionServer = require('rtcmulticonnection-server');


https.listen(443, ( ) => {
	console.log("https open");
});

// URL 포워딩
app.get('/', ( req, res ) => {
	res.sendfile( 'client.html' );
});



// Socket io 
io.on( 'connection', ( socket ) => {
		console.log('connection');
		RTCMultiConnectionServer.addSocket(socket);
		
});