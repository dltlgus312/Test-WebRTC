
// socket.in( socket.roomId ).emit( 'messages', data );
// socket.broadcast.to( socket.roomId ).emit( 'messages', data );

module.exports = exports = function CustomServer(io) {
	
	var io = io;
	
	this.addSocket = function(socket){
		
		var params = socket.handshake.query;
		
		var sessionid = params.sessionid;
		
		var maxParticipantsAllowed = parseInt(params.maxParticipantsAllowed || 1000) || 1000;
		
		var socketMessageEvent = params.msgEvent || 'RTCMultiConnection-Message';
		
		params.socketMessageEvent = socketMessageEvent;
		
		socket.userid = params.userid;
		
		socket.on('disconnect-with', function(remoteUserId, callback) {
			socket.emit('user-disconnected', remoteUserId);
		});
		
		socket.on('close-entire-session', function(callback) {
			callback(true);
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
                }
                catch(e) {
                    pushLogs('socket.ondisconnect', e);
                }
            }
		});
		
		socket.on(socketMessageEvent, function(message, callback) {
			
			socket.in( sessionid ).emit( socketMessageEvent, message );
			
		});
		
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