// enables.video = div || video;
// enables.peerVideo = div || video;
// enables.setting = div;

// enables.screen = div || video; (exact)
// enables.canvas = div; (exact)
// enables.file = div; (exact)
// enables.dataChannel = true; (exact)
// enables.recorde = true; (exact)
// enables.monitoring = true; >> 방장 녹화 (감시용)

// exact는 '필수' 조건이 되며, 지원이 안되는 브라우저일경우 에러


//##############################################
//
// Static Js Import
//
//##############################################

var path = '';
document.write("<script type='text/javascript' src='" + path + "/node_modules/webrtc-adapter/out/adapter.js'></script>");
document.write("<script type='text/javascript' src='" + path + "/node_modules/rtcmultiConnection/dist/RTCMultiConnection.js'></script>"); 
document.write("<script type='text/javascript' src='" + path + "/node_modules/canvas-designer/canvas-designer-widget.js'></script>");
document.write("<script type='text/javascript' src='" + path + "/node_modules/jquery/dist/jquery.min.js'></script>"); 
document.write("<script type='text/javascript' src='" + path + "/socket.io/socket.io.js'></script>"); 
 
function RTC(enables){
	
	//##############################################
	//
	// Dynamic Js Import
	//
	//##############################################
	function importJs(enables){
		[
			(!!enables.record || !!enables.monitoring) ? path + '/node_modules/msr/MediaStreamRecorder.js' : ''
			,!!enables.file ? path + '/node_modules/fbr/FileBufferReader.js' : ''
			,!!enables.canvas ? path + '/node_modules/canvas-designer/dev/webrtc-handler.js' : ''
			,!!enables.canvas ? path + '/node_modules/canvas-designer/canvas-designer-widget.js' : ''
			,!!enables.screen ? path + '/node_modules/webrtc-screen-capturing/Screen-Capturing.js' : ''
		].forEach(function(src) {
			  var script = document.createElement('script');
			  script.async = false;
			  script.type = "text/javascript";
			  script.src = src;
			  document.head.appendChild(script);
		});
	}
	
	
	//##############################################
	//
	// RTC Default Setting & Variable
	//
	//##############################################
	var rtc = this;
	
	var stunOption = {
		urls: 'stun:192.168.25.4:3478'
	}
	
	var turnOption = {
		urls: 'turn:211.44.246.219:3478?transport=tcp',
		credential: 'test',
		username: 'test'
	};
	
	rtc.widgetHtmlURL = path + '/node_modules/canvas-designer/widget.html';
	
	rtc.widgetJsURL = path + '/node_modules/canvas-designer/widget.js';
	
	rtc.designerTools = {
			pencil: true,
			eraser: true,
			line: true,
			arrow: true,
			arc: true,
			rectangle: true,
			undo: true,
			clear: true,
			fullScreen: true,
			
			dragMultiple: true,
			dragSingle: true,
			paging: true,
			pdf: true,
			
			colorsPicker: false,
			extraOptions: false,
			image: false,
			text: false,
			quadratic: false,
			bezier: false,
			marker: false,
			zoom: false,
			lineWidth: false,
			code: false
	}
	
	//##############################################
	//
	// RTCMultiConnection Setting
	//
	//##############################################
	
	var conn;
	
	conn = new RTCMultiConnection();
	
	conn.socketURL = '/';
	
	// conn.socketOptions = { 'path':'/txt/socket/socket.io', "transports": ["websocket"] };
	
	// conn.iceServers = [];
	
	// conn.iceServers.push(stunOption);

	// conn.iceServers.push(turnOption);
	
	// ==========================================================
	
	conn.dontCaptureUserMedia = true;
	
	conn.maxParticipantsAllowed = 9999;
	
	conn.enableFileSharing = !!enables.file;
	
	conn.session = {
			data: !!enables.dataChannel || !!enables.file || !!enables.canvas
	};
	
	conn.fileViewer = false;
	
	conn.multiFilePicker = true;
	
	conn.shareFileInServer = false;
	
	rtc.conn = null;
	
	rtc.enables = null;
	
	rtc.video = null;
	
	rtc.screen = null;
	
	rtc.remoteStreams = [];
	
	rtc.designer = null;
	
	rtc.msr = null;
	
	rtc.resolutionSelect = {};
	
	rtc.deviceSelect = null;
	
	rtc.permission = null;
	
	rtc.msrTime = 10 * 1000; // 모니터링 주기 (밀리세컨드)
	
	// 최대 해상도
	rtc.defResolution = {
		width: 1920,
		height: 1080
	}
	
	// 지원 해상도 목록
	rtc.resolutions = [
		// 4:3
		{label: 'qqVGA', width: 160, height: 120},
		{label: 'qVGA', width: 320, height: 240},
		{label: 'VGA', width: 640, height: 480},
		// 16:9
		{label: 'nHD', width: 640, height: 360},
		{label: 'HD', width: 1280, height: 720},
		{label: 'FHD', width: 1920, height: 1080}
	]
	
	if(!!!enables) {
		enables = {};
		enables.video = false;
		enables.peerVideo = false;
		enables.screen = true;
		enables.recorde = true;
		enables.monitoring = true;
		enables.dataChannel = true;
		enables.canvas = false;
		enables.file = false;
		enables.setting = false;
	}

	enables.dataChannel = !!enables.canvas || !!enables.file || !!enables.dataChannel;
	
	importJs(enables);

	rtc.enables = enables;

	rtc.conn = conn;
	
	//##############################################
	//
	// RTCMultiConnection Event Injection
	//
	// 모든 원격 스트림 & 로컬 스트림이 들어오는 곳
	//
	//##############################################
	this.setstream = function(event) {
		// @@ log
		// console.log(event);
		
		var evt = event;
		
		if(!!!event.type){
			
			// event : 로컬  ( 원격과 규격 통일 )
			
			evt = [];
			
			evt.stream = event;
			
			evt.stream.streamid = event.id;
			
			evt.streamid = event.id;
			
			evt.type = 'local';
			
			evt.userid = rtc.conn.userid;
			
			var video = document.createElement('video');
			
			video.id = event.id;
			
			video.srcObject = event;
			
			video.muted = true;
			
			evt.mediaElement = video;
			
			if(!!rtc.enables.monitoring && rtc.permission === 'super' && rtc.notSupportList.indexOf('recorde') === -1 && !!rtc.msr){
				rtc.msr.addStream(evt.stream); // 모니터링에 추가
			}
			
		}else {
			
			// event : 원격 스트림 ( 녹화시작 )
			event.stream.userid = event.userid
			
			rtc.remoteStreams.push(event.stream);
			
			if(!!rtc.enables.monitoring && rtc.permission === 'super' && rtc.notSupportList.indexOf('recorde') === -1){

				if(!!rtc.msr){
					
					// ## 원격 스트림 추가 ( 피어가 스트림을 두개 이상 사용 할 때 )
					rtc.msr.addStream(evt.stream);
					
				}else {
					
					// ## 원격 스트림 최초 등록 시 녹화 시작
					var streams = rtc.remoteStreams.slice(0);
					
					if(!!rtc.video){
						streams.push(rtc.video);
					}
					
					if(!!rtc.screen){
						streams.push(rtc.screen);
					}
					
					rtc.msr = rtc.recording(streams, {intervalTime: rtc.msrTime});
					
				}
			}
		}
		
		
		evt.stream.play = function(){
			
			var element = document.getElementById(evt.stream.streamid);
			
			try{
				
	            var played = element.play();

	            if (typeof played !== 'undefined') {

	            	played.then(function() {
	                    
	                }).catch(function(error) {
	                	/*** iOS 11 doesn't allow automatic play and rejects ***/
	                	setTimeout(function() {
	                		evt.stream.play();
	                    }, 2000);
	                });
	                return;
	                
	            }else {
	            	
	            	setTimeout(function() {
	            		evt.stream.play();
	            	}, 2000);
	            	
	            }
	            
			} catch(error){
				console.error(error);
			}
		};
		
		evt.stream.stop = function(){
			evt.stream.getTracks().forEach(function(track){
				track.enabled = false;
			});
		};
		
		// Run Time Stream 공유 중지 시 OR 장치 제거 시
		if(evt.type === 'local'){
			
			evt.stream.onactive = function(event){
				try {

					rtc.stopOrStart(event.target.streamid, true, { enabled : true });
					
					rtc.stopOrStart(event.target.streamid, false, { enabled : true });
					
				} catch(error){
					// @@ log
					// console.log(error);
				}
			}
			
			evt.stream.oninactive = function(event){
				
				try {
					
					rtc.stopOrStart(event.target.streamid, true, { enabled : false });
					
					rtc.stopOrStart(event.target.streamid, false, { enabled : false });

				} catch (error) {
					// @@ log
					// console.log(error);
				}				
			}
			
			// 로컬 스트림 디바이스 변경 셀렉터 등록
			if(!!rtc.enables.setting){
				rtc.resolutionSetting(evt.stream);
			}
			
		} else {
		
		}
		
		rtc.onstream(rtc, evt);
		
	};
	
	// onDataChannelOpened SUCCESS
	this.onopen = function(event) {
		// rtc.designer.pointsLength <= 0 && 
		if ( !!rtc.designer && rtc.enables.dataChannel && rtc.notSupportList.indexOf('dataChannel') === -1) {
			setTimeout(function() {
				
				rtc.conn.send({message : 'plz-sync-points', syncFileList : rtc.conn.syncFileList});
				
			}, 1000);
		}
	};

	// Peer Disconnect Event
	// Parameter Data : event.userid, event.extra
	this.onleave = function(event){
		
	}

	// Peer Disconnect Event (Each Stream )
	// Parameter Data : event.stream, event.mediaElement (video)
	this.onstreamended = function(event) {
		
		if(event.offlineId){
			
			var intervalFunction;
			var intervalCnt = 0;
			var hasItem = false;
			
			intervalFunction = setInterval(function() {
				
				intervalCnt = intervalCnt + 1;
				
				if(intervalCnt >= 3 || hasItem) {
					clearInterval(intervalFunction);
				}
				
				rtc.remoteStreams.forEach(function(stream){
					if(stream.userid === event.offlineId){
						rtc.onstreamended({stream : stream});
						hasItem = true;
					}
				});
				
			}, 1000);
			
			return;
			
		}
		
		rtc.remoteStreams.forEach(function(item, index){
			if(item.streamid == event.stream.streamid) {
		    	rtc.remoteStreams.splice(index, 1);
			}
		});
		
		// 원격 피어가 하나도 없을 경우 모니터링 중지
		if(rtc.conn.peers.getLength() === 0 && !!rtc.msr){
			rtc.msr.stop();
			rtc.msr = null;
		}
		
		if(!!rtc.enables.setting){
			// ## 새로고침이 꼬일경우 에러발생....
			try{
				// 각 스트림 (비디오) 해상도 셀렉터 삭제
				var select = rtc.resolutionSelect[event.stream.streamid].elements.select;

				if(!!select && !!select.parentNode){
					select.parentNode.removeChild(select);
				}
				
				delete rtc.resolutionSelect[event.stream.streamid];
			}catch (error){
				// setStream() 호출 시기와 onstreamended() 호출 시간의 문제로 인한 에러시 3초 후 재귀 호출
				// location.reload();
				// console.error(error);
				
				// setTimeout(function() {
				// 	
				// 	rtc.onstreamended(event);
				// 	
				// }, 1000);
			}
		}

		if (!event.mediaElement) {
			event.mediaElement = document.getElementById(event.stream.streamid);
		}
		
		if ( !event.mediaElement || !event.mediaElement.parentNode || event.mediaElement === rtc.video 
								|| event.mediaElement === rtc.peerVideo || event.mediaElement === rtc.screen ) {
			
			event.stream.stop();
			
			var element = document.getElementById(event.stream.streamid);
			
			if(element && element.srcObject){
				element.srcObject = null;
			}
			
			return;
		}
		
		event.mediaElement.parentNode.removeChild(event.mediaElement);
	};
	
	this.onRoomFull = function(error) {
		alert('방이 꽉 찼습니다.');
	};
	
	this.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId){
		// Re join depend
		console.error('Already Join ID: ' + useridAlreadyTaken);
		alert('동일 아이디 접속자가 있습니다.');
	}
	
	this.messageHandler = function(event){
		
		if (event.data.stopOrStart){
			rtc.stopOrStart(event.data.id, event.data.isVideo, {rtc: rtc, enabled: event.data.enabled});
			rtc.onnoticemessage(event.userid, 'stopOrStart', event.data);
		}
		
		if (event.data.message === 'plz-sync-points' && !!rtc.designer) {
			rtc.designer.sync();
			
			// ## 최초 접속자 스트림 권한 denied시 에러 방지
			if(rtc.remoteStreams.length == 0 && rtc.video){
				rtc.conn.addStream(rtc.video);
				rtc.onnoticemessage(event.userid, 'notShareVideo', 'peer is not share video');
			}
			
			rtc.conn.syncFile(event.userid, event.data.syncFileList);
			rtc.onnoticemessage(event.userid, 'initSync', event.data);
		}
		
		if (event.data.canvas && !!rtc.designer) {
			rtc.designer.syncData(event.data.data);
			rtc.onnoticemessage(event.userid, 'syncCanvas', event.data);
		}
		
		if (event.data.syncFile){
			rtc.conn.fbr.getNextChunk(event.data.syncFile, function(nextChunk) {
				rtc.conn.peers[event.userid].peer.channel.send(nextChunk);
			}, event.userid, rtc.conn.userid);
			rtc.onnoticemessage(event.userid, 'syncFile', event.data);
		}

		if (event.data.custom){
			rtc.onmessage(event.data.msg);
			rtc.onnoticemessage(event.userid, 'custom', event.data);
		}
	}
}


//##############################################
//
// Error Handler
//
//##############################################
RTC.prototype.onBrowserNotSupportError = function(errors){
	errors.forEach(function(err){
		if(err === 'all'){
			alert('다른브라우저를 이용해주세요');
		}else if(err === 'screen'){
			alert('스크린 영상을 지원하지 않는 브라우저입니다.');
		}else if(err === 'recorde'){
			alert('녹화를 지원하지 않는 브라우저 입니다.');
		}else if(err === 'dataChannel'){
			alert('데이터전송을 지원하지 않는 브라우저 입니다.');
		}else if(err === 'video'){
			alert('비디오를 지원하지 않는 브라우저 입니다.');
		}
	});
}

RTC.prototype.mediaCaptureErrorHandler = function(error, type){
	
	// @@ log
	// console.error("에러 : " + error);
	
	if(error.name === 'AbortError'){
		if(type == 'audio'){
			alert("오디오를 불러오는 중 중단 되었습니다.");
		}else if(type == 'video'){
			alert("카메라가 다른 장치에서 이미 사용 중 입니다.");
		}else if(type == 'screen'){
			alert("스크린을 가져올 수 없습니다.");
		}
	}else if(error.name === 'NotAllowedError'){
		if(type == 'audio'){
			alert("오디오에 대한 권한을 해제 후 사용가능 합니다.");
		}else if(type == 'video'){
			alert("카메라에 대한 권한을 해제 후 사용가능 합니다.");
		}else if(type == 'screen'){
			// alert("스크린에 대한 권한을 해제 후 사용가능 합니다.");
		}
	}else if(error.name === 'NotFoundError'){
		if(type == 'audio'){
			alert("연결 가능한 오디오가 없습니다.");
		}else if(type == 'video'){
			alert("연결 가능한 카메라가 없습니다.");
		}else if(type == 'screen'){
			alert('스크린을 찾을 수 없습니다.');
		}
	}else if(error.name === 'NotReadableError'){
		alert("장치를 불러올 수 없습니다. \n다시 시도해주세요");
	}else if(error.name === 'SecurityError'){
		alert("SecurityError : HTTPS가 아닌 연결 에러");
	}else if(error.name === 'NotSupportedError'){
		alert("NotSupportedError : 지원 불가");
	}else if(error.name === 'InvalidAccessError'){
		alert("InvalidAccessError : 인자값 오류");
	}else if(error.name === 'TypeError'){ 
		// alert("모든제약조건이 false 이거나 제약 조건이 비어있음");
		alert("TypeError : 알수없는 에러");
	}else if(error.name === 'ReferenceError'){ 
		alert("ReferenceError : 알수없는 에러");
	}else {
		alert(error);
	}
}

RTC.prototype.browserNotSupportErrorHandler = function (){
	
	var enables = this.enables;
	
	var notSupportList = [];
	
	var notSupportCriticalList = [];
	
	window.navigator.mediaDevices = window.navigator.mediaDevices || window.navigator;
	
	if(!!!window.RTCPeerConnection){
		console.error('NOT SUPPORT BROWSER : RTCPeerConnection Not Found');
		notSupportList.push('video');
		if(!!enables.video.exact){
			notSupportCriticalList.push('all');
		}
	}
	
	if(!!!window.navigator.mediaDevices.getUserMedia){
		console.error('NOT SUPPORT BROWSER : getUserMedia Not Found');
		notSupportList.push('video');
		if(!!enables.video.exact){
			notSupportCriticalList.push('video');
		}
	}
	
	if(!!!enables.video && !!!enables.peerVideo){
		console.error('NOT SHARING BROWSER : Not Found Video Contain');
		notSupportList.push('video');
		// notSupportCriticalList.push('video');
	}
	
	if(!!enables.screen && !!!window.navigator.mediaDevices.getDisplayMedia && window.navigator.userAgent.indexOf('Chrome') === -1 && window.navigator.userAgent.indexOf('Edge') !== -1){
		console.error('NOT SUPPORT BROWSER : getDisplayMedia Not Found');
		notSupportList.push('screen');
		if(!!enables.screen.exact){
			notSupportCriticalList.push('screen');
		}
	}
	
	if((!!enables.recorde || !!enables.monitoring ) && window.MediaRecorder === undefined) {
		console.error('NOT SUPPORT BROWSER : MediaRecorder Not Found');
		notSupportList.push('recorde');
		if((!!enables.recorde && !!enables.recorde.exact) || !!enables.monitoring){
			notSupportCriticalList.push('recorde');
		}
	}
	

	if(!!enables.dataChannel && !!!new RTCPeerConnection().createDataChannel){
		console.error('NOT SUPPORT BROWSER : RTCPeerConnection.createDataChannel Not Found');
		notSupportList.push('dataChannel');
		if(!!enables.dataChannel.exact || !!enables.canvas.exact || !!enables.file.exact){
			notSupportCriticalList.push('dataChannel');
		}
	}
	
	this.notSupportList = notSupportList;
	
	return notSupportCriticalList;
}


//##############################################
//
// Main 
//
//##############################################
RTC.prototype.openOrJoin = function(userid, roomid, permission){
	
	var rtc = this;
	
	rtc.permission = permission;
	
	if(!!!permission){
		rtc.permission = 'user';
	}
	
	if(userid === roomid){
		alert('user != roomid');
		return;
	}
	
	rtc.conn.userid = userid || rtc.conn.userid;
	
	rtc.conn.sessionid = roomid;
	
	
	var errors = rtc.browserNotSupportErrorHandler();
	
	if(errors.length !== 0){
		
		rtc.onBrowserNotSupportError(errors);
		
		return ;
	}
	
	// RTCMultiConnection API 이벤트 등록
	rtc.RMCEventHandler();
	
	rtc.beforeOpenOrJoin(function(data){
		
		rtc.conn.openOrJoin(rtc.conn.sessionid);
		
		rtc.afterOpenOrJoin(data);
		
	});
}

RTC.prototype.beforeOpenOrJoin = function(callback){
	
	var rtc = this;

	var constraints = {
		video: rtc.defResolution
	};
	
	rtc.getUserMedia(constraints, 'allinput', function(stream){
		
		// 최초 카메라 미연결 시 디바이스 변경이벤트는 ( 스트림 추가 )
		if(stream === 'NotFoundCamera'){
			navigator.mediaDevices.ondevicechange = function (event){
				rtc.beforeOpenOrJoin('addStream');
			};
		}else {
			
			stream.isVideo = true;
			
			rtc.setstream(stream);
			
			rtc.conn.attachStreams = [stream];
			
			rtc.video = stream;
			
			if(!!rtc.video){
				
				rtc.deviceSetting(stream);
				
				rtc.defResolution.width = stream.getVideoTracks()[0].getSettings().width;

				rtc.defResolution.height = stream.getVideoTracks()[0].getSettings().width / 16 * 9;
				
				rtc.resolutionChange(stream, rtc.defResolution.width + 'x' +  rtc.defResolution.height);

				// 최초 카메라 연결 상태일때 디바이스 변경 이벤트는 ( 디바이스 체인지 )
				navigator.mediaDevices.ondevicechange = function (event){
					if(!!stream.getAudioTracks()[0]){
						rtc.deviceChange(stream, stream.getAudioTracks()[0].getSettings().deviceId, 'audioinput');
					}
					
					if(!!stream.getVideoTracks()[0]){
						rtc.deviceChange(stream, stream.getVideoTracks()[0].getSettings().deviceId, 'videoinput');
					}
				};
			}
		}
		
		if(callback === 'addStream'){
			rtc.conn.addStream(rtc.video);
		}else {			
			callback(stream);
		}
	});		
}

RTC.prototype.afterOpenOrJoin = function(stream){
	var rtc = this;
	
	if(!!rtc.enables.file && rtc.notSupportList.indexOf('dataChannel') === -1){
		rtc.fileShareSetting();
	}
	
	if(!!rtc.enables.canvas && rtc.notSupportList.indexOf('dataChannel') === -1){
		rtc.canvasShareSetting();
	}

}


//##############################################
//
// Configure Setting
//
//##############################################
RTC.prototype.setContains = function(contains){
	this.enables = contains;
}

RTC.prototype.RMCEventHandler = function(){
	var rtc = this;
	
	rtc.conn.onstream = rtc.setstream;

	rtc.conn.onopen = rtc.onopen;
	
	rtc.conn.onRoomFull = rtc.onRoomFull;
	
	rtc.conn.onleave = rtc.onleave;
	
	rtc.conn.onstreamended = rtc.onstreamended;
	
	rtc.conn.onUserIdAlreadyTaken = rtc.onUserIdAlreadyTaken;
	
	if(!!rtc.enables.dataChannel && rtc.notSupportList.indexOf('dataChannel') === -1){
		rtc.conn.onmessage = rtc.messageHandler;
		rtc.conn.onnoticemessage = rtc.onnoticemessage;
	}
}

RTC.prototype.fileShareSetting = function(){
	
	var rtc = this;
	
	rtc.enables.file = rtc.enables.file.exact || rtc.enables.file;
	
	if(rtc.enables.file instanceof jQuery){
		rtc.enables.file = rtc.enables.file[0];
	}
	
	rtc.enables.file.setAttribute("style", "overflow:auto");
	
	rtc.conn.filesContainer = rtc.enables.file;
		
}

RTC.prototype.canvasShareSetting = function(){
	
	var rtc = this;
	
	var designer = new CanvasDesigner();
	
	// ## share coding env
	designer.widgetHtmlURL = rtc.widgetHtmlURL;
	designer.widgetJsURL = rtc.widgetJsURL;
	
	designer.setSelected('pencil');
	
	designer.setTools(rtc.designerTools);
		
	rtc.enables.canvas = rtc.enables.canvas.exact || rtc.enables.canvas;
	
	if(rtc.enables.canvas instanceof jQuery){
		rtc.enables.canvas = rtc.enables.canvas[0];
	}
	
	try{
		if($('#' + rtc.enables.canvas.id).is(":hidden")){
	
			rtc.enables.canvas.setAttribute("style", "display:block;visibility:hidden;");
	
			designer.appendTo(rtc.enables.canvas, function(){
				rtc.enables.canvas.setAttribute("style", "display:none;visibility:visible;");
			});
		}else {
			designer.appendTo(rtc.enables.canvas);
		}
	} catch(error){
		
		console.error('jquery not settings');
		
		designer.appendTo(rtc.enables.canvas);
	}
	
	designer.addSyncListener(function(data) {
		rtc.conn.send({canvas: true, data: data});
	});
	
	// ##### Custom Method Override #####
	designer.onaddfileshare = function(file) {
		rtc.conn.send(file);
		
		// @@ log
		console.log(file);
	};
	
	designer.ondosave = function(data) {
		// dosave ==  'all'  or  'now'  or  dosave.key  or  other 
		// RTC.prototype.canvasDoSave(data) 호출시 
		
		// @@ log
		 console.log(data);
	};
	
	designer.ondataurl = function(data) {
		// RTC.prototype.canvasToDataUrl() 호출시 기본 image/png 타입 base64 리턴
		
		// @@ log
		console.log(data);
	};
	
	rtc.designer = designer;
	
}

// 장치 선택 셀렉터
RTC.prototype.deviceSetting = function(stream){
	var rtc = this;

	navigator.mediaDevices.enumerateDevices().then(function(devices){
		var elements = {};
		var values = {id:null, video:[], audioI:[], audioO:[]};
		
		var vSelect = document.createElement('select');
		var aiSelect = document.createElement('select');
		var aoSelect = document.createElement('select');
		
		elements.id = stream.streamid;
		values.id = stream.streamid;
	
		vSelect.id = stream.streamid + '_videoSelect';
		aiSelect.id = stream.streamid + '_audioISelect';
		aoSelect.id = stream.streamid + '_audioOSelect';
		
		var vDefault = document.createElement('option');
		var aiDefault = document.createElement('option');
		var aoDefault = document.createElement('option');
		
		vDefault.text = '카메라 선택';
		aiDefault.text = '마이크 선택';
		aoDefault.text = '스피커 선택';
		
		vSelect.appendChild(vDefault);
		aiSelect.appendChild(aiDefault);
		aoSelect.appendChild(aoDefault);
		
		devices.forEach(function(device, index){
			var option = document.createElement('option');
			option.text = device.kind + " : " + device.label;
			option.value = device.deviceId;
			
			if(device.kind === 'videoinput'){
				vSelect.appendChild(option);
				values.video.push(device);
			}else if(device.kind === 'audioinput'){
				aiSelect.appendChild(option);
				values.audioI.push(device);
			}else if(device.kind === 'audiooutput'){
				aoSelect.appendChild(option);
				values.audioO.push(device);
				
				var vElement = document.getElementById(stream.streamid);
				
				if(!!vElement && vElement.sinkId !== 'undefined' && vElement.sinkId === device.deviceId){
					option.selected = true;
				}else if(!!vElement && vElement.sinkId !== 'undefined' && vElement.sinkId === '' && device.deviceId === 'default'){
					vElement.setSinkId('default').then(function(){
						// rtc.deviceSetting(stream);
						option.selected = true;
					}).catch(function(error){
						// @@ log
						// console.error('audio output error : ', error);
					});;
				}
				
			}
			
			stream.getTracks().forEach(function(track){
				if(device.kind !== 'audiooutput' && (device.deviceId === track.getSettings().deviceId || device.deviceId === track.getConstraints().deviceId)){
					option.selected = true;
				}
			});
		});
		
		elements.video = vSelect;
		elements.audioI = aiSelect;
		elements.audioO = aoSelect;
		
		elements.video.onchange = function(event){
			rtc.deviceChange(stream, elements.video.options[elements.video.selectedIndex].value, 'videoinput');
		}
		
		elements.audioI.onchange = function(event){
			rtc.deviceChange(stream, elements.audioI.options[elements.audioI.selectedIndex].value, 'audioinput');
		}
		
		elements.audioO.onchange = function(event){
			rtc.deviceChange(stream, elements.audioO.options[elements.audioO.selectedIndex].value, 'audiooutput');
		}
		
		rtc.deviceSelect = {elements, values};
		
		rtc.ondevicesetting(rtc.deviceSelect);
		
	}).catch(function(error){
		console.error(error);
	});
}

// 화질 선택 셀렉터
RTC.prototype.resolutionSetting = function(stream){
	
	var optimalList = [], isOpt = false;
	
	var width = stream.getVideoTracks()[0].getSettings().width;
//	var height = stream.getVideoTracks()[0].getSettings().height;
	var height = width / 16 * 9;
	
//	for ( var index in rtc.resolutions ){
//		
//		var resolution = rtc.resolutions[index];
//		
//		optimalList.push(resolution);
//		
//		if(resolution.width === width && resolution.height === height){
//			isOpt = true;
//			break;
//		}
//	}
	
//	if(!isOpt){
		optimalList = [];
		
		optimalList.push({label: 'high', width: width, height: height});
		
		optimalList.push({label: 'midle', width: Math.floor(width/10*5), height: Math.floor(height/10*5)});
		
		optimalList.push({label: 'low', width: Math.floor(width/10), height: Math.floor(height/10)});
//	}
	
	var elements = {}, values = [], select, defaultOp;
	
	elements.id = stream.streamid;
	
	defaultOp = document.createElement('option');
	
	defaultOp.text = '해상도 선택';
	
	defaultOp.value = '0';
	
	select = document.createElement('select');
	
	select.id = stream.streamid + '_resolution';
	
	select.appendChild(defaultOp);
	
	for ( var index in optimalList ){
		
		var opt = optimalList[index];
		
		var option = document.createElement('option');
		
		option.text = opt.label;
		
		option.value = opt.width + 'x' + opt.height;
		
		values.push(opt);
		
		select.appendChild(option);
		
		if(width === opt.width){
			option.selected = true;
		}
		
	}
	
	select.onchange = function(event){
		rtc.resolutionChange(stream, select.options[select.selectedIndex].value);
	}
	
	elements.select = select;
	
	rtc.resolutionSelect[stream.streamid] = {elements, values};
	
	rtc.onresolutionsetting(rtc.resolutionSelect[stream.streamid]);
	
}


//##############################################
//
// Development Event 
//
//##############################################
RTC.prototype.recording = function(streams, data){
	// data : intervalTime (녹화 간격 : null 일경우 처음부터 끝까지 녹화), constraints (비디오 해상도)
	// 모니터링 & 로컬 사용자 녹화
	var multiStreamRecorder;
	
	if(!!data && !!data.constraints){
		multiStreamRecorder = new MultiStreamRecorder(streams, data.constraints);
	}else {
		multiStreamRecorder = new MultiStreamRecorder(streams, {
			video: {
				width: 1280,
				height: 720
			}
		});		
	}
	
	multiStreamRecorder.mimeType = 'video/x-matroska;codecs=avc1';
	
	multiStreamRecorder.ondataavailable = function(blob){
		
		var timestamp = new Date().getTime();
		
		// @@ log
		// console.log(blob);
		
		if(!!!data || ( !!data && !!!data.intervalTime )){
			
			// 로컬 녹화 
			
			// 임시 녹화 (making url)
			rtc.multiRecordeTempUrl(blob, 'local');
	
		}else if(!!data && !!data.intervalTime){
			
			// 모니터링
			rtc.conn.socket.emit('monitoring', { name:timestamp, data:blob, type:blob.type, end:false });
			
			// @@ 임시 모니터링 (making url)
			// rtc.multiRecordeTempUrl(blob, 'server');
		}
	};
	
	multiStreamRecorder.onstop = function(e){
		
		multiStreamRecorder.ondataavailable = function(blob){
			// 잔여 기록물 활동중지
		};
		
		if(!!data && !!data.intervalTime){
			// 모니터링 종료
			rtc.conn.socket.emit('monitoring', { end:true });
		}
	}
	
	multiStreamRecorder.start(data && data.intervalTime ?  data.intervalTime : 0);
	
	return multiStreamRecorder;
	
}

RTC.prototype.getUserMedia = function(constraints, kind, callback){
	
	var rtc = this;
	
	if(kind === 'audioinput'){
		
		navigator.mediaDevices.getUserMedia(constraints).then(function(audioStream){
			
			callback(audioStream);
			
		}).catch(function(error){
			
			rtc.mediaCaptureErrorHandler(error, 'audio');
			
		});
		
	} else if(kind === 'videoinput' || kind === 'allinput'){
		
		navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream){
			
			if(kind === 'allinput'){
				
				navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: true
					}
				}).then(function(audioStream){
					
					mediaStream.addTrack(audioStream.getAudioTracks()[0]);
					
					callback(mediaStream);
					
				}).catch(function(error){
					
					rtc.mediaCaptureErrorHandler(error, 'audio');
					
					callback(mediaStream);
					
				});
				
			} else {
				callback(mediaStream);
			}
			
		}).catch(function(error){
			
			rtc.mediaCaptureErrorHandler(error, 'video');
			
			callback('NotFoundCamera');
			
		});
	}else {
		console.error('audioinput, videoinput, allinput 중 1택');
	}
}

RTC.prototype.getDisplayMedia = function(callback){
	if(navigator.mediaDevices.getDisplayMedia){
		
		navigator.mediaDevices.getDisplayMedia().then(function(stream){
			
			callback(stream)
			
		}).catch(function(error){
			
			rtc.mediaCaptureErrorHandler(error, 'screen');
			
		});
		
	}else if(navigator.userAgent.indexOf('Chrome') !== -1){
		
		// @@ screen
		alert('스크린 공유 미지원 브라우저를 위한 확장프로그램 준비중입니다. \n브라우저 버전 업데이트 혹은 다른 브라우저를 이용해주세요');
		return;
		
		getChromeExtensionStatus('hgpahehaffcbhjfccbhmdfehkokciibh', function(status) {
			
			if(status == 'installed-enabled') {
				
				// 스크린 재공유 Screen-Capturing sourceId 초기화
				
				sourceId =  null; 
				
				getScreenConstraints(function(error, screen_constraints) {
					
					if (error) {
						// @@ log
						// console.log(error);
						return 
					}

					if(screen_constraints.canRequestAudioTrack) {
						navigator.mediaDevices.getUserMedia({
							video: screen_constraints,
							audio: screen_constraints
						}).then(function(stream) {
							callback(stream);
						}).catch(function(error){
							rtc.mediaCaptureErrorHandler(error, 'screen');
						});
					} else {
						navigator.mediaDevices.getUserMedia({
							video: screen_constraints
						}).then(function(stream) {
							callback(stream);
						}).catch(function(error){
							rtc.mediaCaptureErrorHandler(error, 'screen');
						});
					}
				}, true);
				
			}
			
			if(status == 'installed-disabled') {
				// chrome extension is installed but disabled.
				// 설치는 되었으나 작동하지 않는 오류
			}
			
			if(status == 'not-installed') {
				// chrome extension is not installed
				var isInstall = confirm("스크린 공유를 지원하지 않는 브라우저 입니다. \n해당 브라우저에서 스크린공유를 원하실 경우 확장프로그램을 설치 하셔야 합니다. \n설치 하시겠습니까?");
				if(isInstall){
					window.parent.location.href = 'https://chrome.google.com/webstore/detail/ebsw-screencapturing/hgpahehaffcbhjfccbhmdfehkokciibh?authuser=1';
				}
			}
			
			if(status == 'not-chrome') {
				// using non-chrome browser
				alert('확장프로그램을 설치 할 수 없는 브라우저 입니다.');
			}
		});
		
	} else {
		alert('스크린공유를 지원하지 않는 브라우저 입니다.');
	}
}

RTC.prototype.deviceChange = function(stream, deviceId, kind){
	var rtc = this;
	
	var constraints;
	var isVideo = true;
	var oTrack;
	
	if(kind === 'audiooutput'){
		
		var element = document.getElementById(stream.streamid);
		
		if(!!element && element.sinkId !== 'undefined'){
			
			element.setSinkId(deviceId).then(function(){
				rtc.deviceSetting(stream);
			}).catch(function(error){
				rtc.mediaCaptureErrorHandler(error, 'audio');
			});
			
		}
		
		return;
	} else if(kind === 'audioinput'){
		
		constraints = {	
			audio : {
				deviceId: deviceId,
				echoCancellation: true
			}
		}
		
		oTrack = stream.getAudioTracks()[0];
		
		isVideo = false;
	
	} else if(kind === 'videoinput'){
		oTrack = stream.getVideoTracks()[0];
		
		// Roll Back Setting ( 새로운 스트림이 기존의 셋팅( 해상도 )을 유지하는 오류 )
		oTrack.applyConstraints(rtc.defResolution);
		
		constraints = {	
			video : {
				deviceId: deviceId,
				width: rtc.defResolution.width,
				height: rtc.defResolution.height
			}
		}
	}
	
	rtc.getUserMedia(constraints, kind, function(str){
		
		var nTrack = str.getTracks()[0];
		
		// param : old(stream || track), new(stream || track), remoteid, isVideo
		
		stream.removeTrack(oTrack);

		stream.addTrack(nTrack);
		
		stream.play();

		rtc.deviceSetting(stream);
		
		if(isVideo){
			rtc.resolutionSetting(stream);
		}
		
		rtc.conn.replaceTrack(oTrack, nTrack, null, isVideo);
		
	});
}

// 해상도 변경
RTC.prototype.resolutionChange = function(stream, value){
	var rtc = this;
	
	// default 값 선택시 이전 값으로 되돌리기
	if(value == 0){
		for(var i=0; i<rtc.resolutionSelect[stream.streamid].elements.select.options.length; i++){
			if(rtc.resolutionSelect[stream.streamid].elements.select.options[i].value.split('x')[0] == 
					stream.getVideoTracks()[0].getSettings().width){
				rtc.resolutionSelect[stream.streamid].elements.select.options[i].selected = true;
				return;
			}
		}
		
		// ## Fire Fox Min Width Not Over Setting Error
		rtc.resolutionSelect[stream.streamid].elements.select.options[3].selected = true;
		return;
	}
	
	value = value.split('x');
	
	var track = stream.getVideoTracks()[0];

	track.applyConstraints({
		width : value[0],
		height : value[1]
	}).then(function(){
//		rtc.defResolution.width = track.getSettings().width;
//		rtc.defResolution.height = track.getSettings().height;
	});
}

//##############################################
//
// External Event 
//
//##############################################
RTC.prototype.shareScreen = function(){
	
	var rtc = this;
		
	rtc.getDisplayMedia(function(newStream){
		
		if(!!!rtc.screen){

			newStream.isScreen = true;
			
			rtc.screen = newStream;
			
			rtc.setstream(newStream);
			
			rtc.conn.addStream(newStream);
			
		}else {
			
			var oldVideoTrack = rtc.screen.getVideoTracks()[0];
			
			var newVideoTrack = newStream.getVideoTracks()[0];
			
			var oldAudioTrack = rtc.screen.getAudioTracks()[0];
			
			var newAudioTrack = newStream.getAudioTracks()[0];
			
			
			rtc.screen.removeTrack(oldVideoTrack);
			
			rtc.screen.addTrack(newVideoTrack);

			
			if(!!oldAudioTrack){
				
				if(!!newAudioTrack){
					
					rtc.conn.replaceTrack(oldAudioTrack, newAudioTrack);
					
					rtc.screen.removeTrack(oldAudioTrack);
					
					rtc.screen.addTrack(newAudioTrack);
					
					oldAudioTrack.enabled = false;
					
					oldAudioTrack.stop();
				}else {
					
					rtc.screen.removeTrack(oldAudioTrack);
					
					oldAudioTrack.enabled = false;
					
					oldAudioTrack.stop();
				}
			} else if(!!newAudioTrack){
				
				rtc.screen.addTrack(newAudioTrack);
				
				newAudioTrack.start();
			}
			
			rtc.screen.play();

			rtc.conn.replaceTrack(oldVideoTrack, newVideoTrack, null, true);
		
		}
	});
}

RTC.prototype.shareFile = function(){
	
	var rtc = this;
	
	var fileSelector = new FileSelector();
	
	if(rtc.conn.multiFilePicker){
		fileSelector.selectMultipleFiles(function(files) {
			if(rtc.conn.shareFileInServer){
				// @@ multi file upload in server 
				
			}else {
				files.forEach(function(file){
					rtc.conn.send(file);
				});
			}
		});
	}else {
		fileSelector.selectSingleFile(function(file) {
			if(rtc.conn.shareFileInServer){
				// @@ single file upload in server
				
			}else {
				rtc.conn.send(file);
			}
		});
	}
}

//스트림 중지 & 스타트 (원격 & 로컬[ 사용자 조작, 권한 조작(공유 중지) 이벤트 ])
RTC.prototype.stopOrStart = function(streamId, isVideo, param){
	if(!!param && !!param.rtc){
		// Local Stream In Remote >> Local Self Stream ( SUPER Permission )
		var rtc = param.rtc;
		var enabled = param.enabled;
		
		if(!!rtc.video && streamId === rtc.video.streamid){
			
			isVideo ? rtc.video.getVideoTracks()[0].enabled = enabled : rtc.video.getAudioTracks()[0].enabled = enabled;
			
			isVideo ? rtc.video.getVideoTracks()[0].superGuard = !enabled : rtc.video.getAudioTracks()[0].superGuard = !enabled;
			
		} else if(!!rtc.screen && streamId === rtc.screen.streamid){
			
			isVideo ? rtc.screen.getVideoTracks()[0].enabled = enabled : rtc.screen.getAudioTracks()[0].enabled = enabled;
			
			isVideo ? rtc.screen.getVideoTracks()[0].superGuard = !enabled : rtc.screen.getAudioTracks()[0].superGuard = !enabled;
			
		} else {
			// Remote Self Stream >> Remote Stream In Local 
			rtc.remoteStreams.forEach(function(stream){
				
				if(streamId === stream.streamid){
					
					isVideo ? stream.getVideoTracks()[0].enabled = enabled : stream.getAudioTracks()[0].enabled = enabled;
					
					isVideo ? stream.getVideoTracks()[0].userGuard = !enabled : stream.getAudioTracks()[0].userGuard = !enabled;
					
				}
				
			});
			
		}

	}else {
		// Local Stream & Remote Stream
		var rtc = this;
		
		var enabled;
		
		var videoElement = document.getElementById(streamId);
		
		var track = isVideo ? videoElement.srcObject.getVideoTracks()[0] : videoElement.srcObject.getAudioTracks()[0];
		
		if(rtc.permission !== 'super' && !!track.superGuard){
			rtc.onstoporstartdepend('super');
			return;
		}else if(!!track.userGuard){
			rtc.onstoporstartdepend('user');
			return;
		}
		
		if(!!param && !!param.enabled){
			
			enabled = param.enabled;
			
		}else {
			
			enabled = !track.enabled;
			
		}
		
		track.enabled = enabled;
		
		rtc.conn.send({
			stopOrStart : true,
			id: streamId,
			isVideo : isVideo,
			enabled: enabled
		});
	}
}

RTC.prototype.sendMessage = function(msg){
	var rtc = this;
	rtc.conn.send({custom: true, msg: msg});
}

// #################### 캔버스 이벤트 ##########################
RTC.prototype.canvasEnableTouch = function(enable){
	// param : true, false
	var rtc = this;
	rtc.designer.enableTouch(enable);
}

RTC.prototype.canvasToDataUrl = function(){
	// resule : base64
	var rtc = this;
	rtc.designer.toDataURL('image/png');
}

RTC.prototype.canvasDoSave = function(data){
	// dosave : empty, 'all', 'now', {key : key, page : page}
	// result : points, pencilUndo, shapeSelectList
	var rtc = this;
	rtc.designer.doSave(data);
}
// ########################################################




//##############################################
//
// Override Method Event
//
//##############################################
RTC.prototype.onstream = function(rtc, event){
	
	var enables = rtc.enables;
	
	var contain;

	contain = !!event.stream.isScreen ? rtc.enables.screen.exact || rtc.enables.screen : event.type === 'remote' ? rtc.enables.peerVideo || rtc.enables.video : rtc.enables.video;
	
	if(contain instanceof jQuery){
		contain = contain[0];
	}
	
	if(contain instanceof HTMLDivElement){
		
		contain.appendChild(event.mediaElement);
		
	}else if(contain instanceof HTMLVideoElement){
		
		contain.srcObject = event.stream;
		
		contain.id = event.stream.streamid;
		
	}else {
		console.error('contain(video, peerVideo, screen) type only Element', contain);
	}
	
	event.stream.play();
}

// Parameter Data : event.selects == Type select Element List,
//					event.values == Type Array List In To List
RTC.prototype.ondevicesetting = function(event){
	var rtc = this;
	
	for(index in event.elements){
		
		var select = event.elements[index]
		
		var element = document.getElementById(select.id);
	
		if(!!element){
			
			element.parentNode.removeChild(element);
			
		}
	}
	
	
	if(rtc.enables.setting instanceof jQuery){
		
		rtc.enables.setting = rtc.enables.setting[0];
		
	}else if(rtc.enables.setting instanceof HTMLDivElement){
		
	}else {
		
		console.error('enables.setting 타입이 \'HTMLDivElement\'가 아닙니다.');
		
		return;
	}
	
	rtc.enables.setting.appendChild(event.elements.video);
	
	rtc.enables.setting.appendChild(event.elements.audioI);
	
	rtc.enables.setting.appendChild(event.elements.audioO);
	
}

// Parameter Data : event.selects == Type Select Element, 
//					event.values == Type Array List
RTC.prototype.onresolutionsetting = function(event){
	var rtc = this;
	
	var element = document.getElementById(event.elements.select.id);
	
	if(!!element){
		element.parentNode.removeChild(element);
	}
	
	if(rtc.enables.setting instanceof jQuery){
		
		rtc.enables.setting = rtc.enables.setting[0];
		
	}else if(rtc.enables.setting instanceof HTMLDivElement){
		
	}else {
		
		console.error('enables.setting 타입이 \'HTMLDivElement\'가 아닙니다.');
		
		return;
	}
	
	rtc.enables.setting.appendChild(event.elements.select);
}

RTC.prototype.onstoporstartdepend = function(type){
	if(type === 'super'){
		// alert('방장권한');
	}else if(type === 'user'){
		// alert('유저권한');
	}
}

// Custom Message Override
RTC.prototype.onmessage = function(msg){
	
}

// 알림
RTC.prototype.onnoticemessage = function(userid, type, data){
	// @@ log
	console.log(userid, type, data);
}









// Temp
RTC.prototype.multiRecordeTempUrl = function(blob, type){
	var url = URL.createObjectURL(blob);
	var html = "<a href='" + url + "' '> 녹화파일 </a><br/>";
	var contain;
	
	if(type=='server'){
		contain = document.getElementById('server-record');
	}else {
		contain = document.getElementById('local-record');
	}
	
	contain.innerHTML += html;
	
	contain.scrollTop = contain.scrollHeight - contain.clientHeight;
}