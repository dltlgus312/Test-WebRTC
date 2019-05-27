
// socket.in( socket.roomId ).emit( 'messages', data );
// socket.broadcast.to( socket.roomId ).emit( 'messages', data );

var ffmpeg = require('fluent-ffmpeg');

var fs = require('fs');

module.exports = exports = function CustomServer(io) {
	
	var io = io;
	
	var path = __dirname + "/../temp/";
	
	var names = '';
	
	var exe = '';
	
	this.addSocket = function(socket){
		
		var params = socket.handshake.query;
		
		var sessionid = params.sessionid;
		
		console.log( 'Rtc Multi Connection ::: Signaling-CustomServer.addSocket' );
		console.log( '::: USER Connection ID = ' + params.userid );
		console.log( '::: ROOM Connection ID = ' + params.sessionid );
		
		var maxParticipantsAllowed = parseInt(params.maxParticipantsAllowed || 1000) || 1000;
		
		var socketMessageEvent = params.msgEvent || 'RTCMultiConnection-Message';
		
		params.socketMessageEvent = socketMessageEvent;
		
		socket.userid = params.userid;

		socket.on('monitoring', function(data){
			if(!data.end){
				
				if( data.type.indexOf('x-matroska') !== -1 || data.type.indexOf('mp4') !== -1 ){
					// mp4 / h264
					exe = 'mp4';
				} else if ( data.type.indexOf('webm') !== -1 ){
					// webm / vp8,9
					exe = 'webm';
				}
				
				var name = data.name + "." + exe;
				
				var wstream = fs.createWriteStream( path + name );
				
				wstream.write(data.data);
				
				wstream.end();
				
				names = names + 'file ' + name + '\n';
				
			} else {
				endMonitoring();
			}
		});
		
		socket.on('disconnect-with', function(remoteUserId, callback) {
			
			socket.emit('user-disconnected', remoteUserId);
			
			if(names !== ''){
				endMonitoring();
			}
			
		});
		
		socket.on('close-entire-session', function(callback) {
			
			callback(true);
			
			if(names !== ''){
				endMonitoring();
			}
			
		});
		
		socket.on('check-presence', function(roomid, callback) {
			
			io.adapter.clients([roomid], function(err, clients){
				
				// ## Join Room
				if(clients.length > 0){
					
					callback(true, roomid, {
                        _room: {
							isFull: clients.length >= maxParticipantsAllowed,
                            isPasswordProtected: false
                        }
                    });
					
				}else {
					
					// ## Open Room
					callback(false, roomid, {
                        _room: {
                            isFull: false,
                            isPasswordProtected: false
                        }
                    });
					
				}
				
			});
			
		});
		
		socket.on('open-room', function(arg, callback) {
			
			joinRoom(sessionid, callback);
			
		});
		
		socket.on('join-room', function(arg, callback) {
			
			joinRoom(sessionid, callback);
			
		});
		 
		socket.on('disconnect', function() {
			
			socket.in(sessionid).emit('user-disconnected', socket.userid);

			if (socket.ondisconnect) {
				
				try {
					
                    socket.ondisconnect();
					
                } catch(e) {
					
                    pushLogs('socket.ondisconnect', e);
					
                }
				
            }
			
		});
		
		socket.on(socketMessageEvent, function(message, callback) {
			
			socket.in( sessionid ).emit( socketMessageEvent, message );
			
		});
		
		function endMonitoring(){
			fs.writeFileSync( path + socket.handshake.query.userid + '.txt', names );
				
			var mg = ffmpeg();
			
			mg.input( path + socket.handshake.query.userid + '.txt' )
			.inputOptions(['-f concat', '-safe 0'])
			// .videoCodec('libx264')
			.outputOptions('-c copy')
			.on('end', function(){
				console.log('file save success');
				names = '';
			})
			.on('error', function(err){
				console.log('file save err', err);
			})
			.save( path + socket.handshake.query.userid + '.' + exe );
		}
		
		function joinRoom(roomid, callback){
			
			// socket.emit('userid-already-taken', params.userid, '');
			
			io.adapter.clients([ sessionid ], function(err, clients) {
				
				if(clients.length >= maxParticipantsAllowed){
					
					callback(false, 'is Room Full');
				}else {
					
					socket.join(roomid);
					
					callback(true, roomid);
				}
				
			});
			
		}
		
	}
	
}