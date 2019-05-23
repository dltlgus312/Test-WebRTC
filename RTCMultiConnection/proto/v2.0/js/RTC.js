
// enables.video = div || video;
// enables.peerVideo = div || video;
// enables.setting = div;

// enables.screen = div || video; (exact)
// enables.canvas = div; (exact)
// enables.fileShare = div; (exact)
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
document.write("<script type='text/javascript' src='" + path + "/socket.io/socket.io.js'></script>"); 

// ## share coding env
// var path = '/txt';
// document.write("<script type='text/javascript' src='" + path + "/js/adapter/adapter.js'></script>");
// document.write("<script type='text/javascript' src='" + path + "/js/custom/rtcmultiConnection/dist/RTCMultiConnection.js'></script>"); 
// document.write("<script type='text/javascript' src='" + path + "/node_modules/socket.io-client/dist/socket.io.js'></script>"); 

function RTC(enables){
	
	//##############################################
	//
	// Dynamic Js Import
	//
	//##############################################
	function importJs(enables){
		[
			(!!enables.record || !!enables.monitoring) ? path + '/node_modules/msr/MediaStreamRecorder.js' : ''
			,!!enables.fileShare ? path + '/node_modules/fbr/FileBufferReader.min.js' : ''
			,!!enables.canvas ? path + '/node_modules/canvas-designer/dev/webrtc-handler.js' : ''
			,!!enables.canvas ? path + '/node_modules/canvas-designer/canvas-designer-widget.js' : ''
			,!!enables.screen ? path + '/node_modules/webrtc-screen-capturing/Screen-Capturing.js' : ''
			
			// ## share coding env
			// (!!enables.record || !!enables.monitoring) ? path + '/js/custom/msr/MediaStreamRecorder.min.js' : ''
			// ,!!enables.fileShare ? path + '/node_modules/fbr/FileBufferReader.min.js' : ''
			// ,!!enables.canvas ? path + '/js/custom/canvas-designer/dev/webrtc-handler.js' : ''
			// ,!!enables.canvas ? path + '/js/custom/canvas-designer/canvas-designer-widget.js' : ''
			// ,!!enables.screen ? path + '/js/custom/webrtc-screen-capturing/Screen-Capturing.js' : ''
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
		enables.fileShare = false;
		enables.setting = false;
	}

	if(!!enables.canvas || !!enables.fileShare){
		enables.dataChannel = true;
	}
	
	rtc.enables = enables;
	
	importJs(rtc.enables);
	
	
	//##############################################
	//
	// RTCMultiConnection Setting
	//
	//##############################################
	var stunOption = {
		urls: 'stun:192.168.25.4:3478'
	}
	
	var turnOption = {
		urls: 'turn:211.44.246.219:3478?transport=tcp',
		credential: 'test',
		username: 'test'
	};
	
	var conn;
	
	conn = new RTCMultiConnection();
	
	conn.socketURL = '/';
	
	// ## share coding env
	// conn.socketOptions = { 'path':'/shareCoding/socket/socket.io', "transports": ["websocket"] };
	
	conn.dontCaptureUserMedia = true;
	
	conn.maxParticipantsAllowed = 2;
	
	conn.iceServers = [];
	
	conn.iceServers.push(stunOption);

	conn.iceServers.push(turnOption);
	
	conn.session = {
		data: !!enables.dataChannel
	};
	
	conn.enableFileSharing = !!enables.fileShare;
	
	rtc.conn = conn;
	
	
	//##############################################
	//
	// RTCMultiConnection Event Injection
	//
	// 모든 원격 스트림 & 로컬 스트림이 들어오는 곳
	//
	//##############################################
	this.setstream = function(event) {
		
		console.log(event);
		
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
			document.getElementById(evt.stream.streamid).play();
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
					console.log(error);
				}
			}
			
			evt.stream.oninactive = function(event){
				
				try {
					
					rtc.stopOrStart(event.target.streamid, true, { enabled : false });
					
					rtc.stopOrStart(event.target.streamid, false, { enabled : false });

				} catch (error) {
					console.log(error);
				}				
			}
			
		} else {
		
		}
		
		if(!!rtc.enables.setting){
			rtc.resolutionSetting(evt.stream);
		}
		
		rtc.onstream(rtc, evt);
	};

	this.onopen = function(event) {
		if (!!rtc.designer && rtc.designer.pointsLength <= 0 && rtc.enables.dataChannel && rtc.notSupportList.indexOf('dataChannel') === -1) {
			setTimeout(function() {
				rtc.conn.send('plz-sync-points');
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
		
		rtc.remoteStreams.splice(event.stream, 1);
		
		// 원격 피어가 하나도 없을 경우 모니터링 중지
		if(rtc.remoteStreams.length === 0 && !!rtc.msr){
			rtc.msr.stop();
			rtc.msr = null;
		}
		
		if(!!rtc.enables.setting){
			// 각 스트림 (비디오) 해상도 셀렉터 삭제
			var select = rtc.resolutionSelect[event.stream.streamid].elements.select;
			
			if(!!select && !!select.parentNode){
				select.parentNode.removeChild(select);
			}
		}

		if (!event.mediaElement) {
			event.mediaElement = document.getElementById(event.stream.streamid);
		}
		
		if (!event.mediaElement || !event.mediaElement.parentNode) {
			
			event.stream.stop();
			
			document.getElementById(event.stream.streamid).srcObject = null;
			
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
		}
		
		if (event.data === 'plz-sync-points' && !!rtc.designer) {
			rtc.designer.sync();
			return;
		}
		
		if (event.data.canvas && !!rtc.designer) {
			rtc.designer.syncData(event.data.data);
		}
		
		if (event.data.custom){
			rtc.onMessage(event.data.msg);
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
			alert('데이터 공유를 지원하지 않는 브라우저 입니다.');
		}
	});
}

RTC.prototype.onMediaCaptureError = function(error, isAudio){
	if(error === 'AbortError'){
		if(!!isAudio){
			alert("오디오를 불러오는 중 중단 되었습니다.");
		}else {
			alert("카메라가 다른 장치에서 이미 사용 중 입니다.");
		}
	}else if(error === 'NotAllowedError'){
		alert("카메라에 대한 권한을 해제 후 사용가능 합니다.");
	}else if(error === 'NotFoundError'){
		if(!!isAudio){
			alert("연결 가능한 오디오가 없습니다.");
		}else {
			alert("연결 가능한 카메라가 없습니다.");
		}
	}else if(error === 'NotReadableError'){
		alert("알수없는 오류가 발생했습니다.");
	}else if(error === 'SecurityError'){
		alert("HTTPS가 아닌 연결 에러");
	}else if(error === 'NotSupportedError'){
		alert("지원 불가");
	}else if(error === 'InvalidAccessError'){
		alert("인자값 오류");
	}else if(error === 'TypeError'){ 
		// alert("모든제약조건이 false 이거나 제약 조건이 비어있음");
		alert("알수없는 에러");
	}else if(error === 'ReferenceError'){ 
		alert("알수없는 에러");
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
		notSupportCriticalList.push('all');
	}
	
	if(!!!window.navigator.mediaDevices.getUserMedia){
		console.error('NOT SUPPORT BROWSER : getUserMedia Not Found');
		notSupportCriticalList.push('all');
	}
	
	if(!!!enables.video && !!!enables.peerVideo){
		console.error('NOT SUPPORT BROWSER : Not Found Video Contain');
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
		if(!!enables.dataChannel.exact || !!enables.canvas.exact || !!enables.fileShare.exact){
			notSupportCriticalList.push('dataChannel');
		}
	}
	
	this.notSupportList = notSupportList;
	
	this.onBrowserNotSupportError(notSupportCriticalList);
	
	return notSupportCriticalList;
}

RTC.prototype.mediaCaptureErrorHandler = function(error, isAudio){
	
	console.error("에러 : " + error);
	
	this.onMediaCaptureError(error.name, isAudio);
	
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
	
	rtc.beforeOpenOrJoin(function(data){
		
		// browserNotSupportErrorHandler return
		if(data === 'return'){
			return;
		}
		
		rtc.conn.openOrJoin(rtc.conn.sessionid);
		
		rtc.afterOpenOrJoin(data);
		
	});
}

RTC.prototype.beforeOpenOrJoin = function(callback){
	
	var rtc = this;
	
	var errors = rtc.browserNotSupportErrorHandler();
	
	if(errors.length !== 0){
		alert('접속이 불가능 합니다.');
		console.error("Not Working List : " + errors);
		callback('return');
		return ;
	}
	
	// RTCMultiConnection API 이벤트 등록
	rtc.RMCEventHandler();
	
	// 브라우저 최초 접속시 navigator.ondevicechange 이벤트가 자동 발생 (에러 방지용 변수)
	rtc.initConnection = true;
	
	var constraints = {
		// 지원불가한 해상도는 아래의 값에 따라 유사한 해상도 자동 선택
		video: rtc.defResolution
	};
	
	rtc.getUserMedia(constraints, 'allinput', function(stream){
		
		rtc.initConnection = false;
		
		stream.isVideo = true;
		
		rtc.setstream(stream);
		
		rtc.conn.attachStreams = [stream];
		
		rtc.video = stream;
		
		if(!!rtc.video && !!rtc.enables.setting){
			
			rtc.deviceSetting(stream);
			
			// @@ 장치 변경 이벤트 (스피커 처리 필요)
			navigator.mediaDevices.ondevicechange = function (event){
				if(!!stream.getAudioTracks()[0]){
					rtc.deviceChange(stream, stream.getAudioTracks()[0].getSettings().deviceId, 'audioinput');
				}
				
				if(!!stream.getVideoTracks()[0]){
					rtc.deviceChange(stream, stream.getVideoTracks()[0].getSettings().deviceId, 'videoinput');
				}
			};
		}
		
		callback(stream);
	});
}

RTC.prototype.afterOpenOrJoin = function(stream){
	var rtc = this;
	
	if(!!rtc.enables.fileShare && rtc.notSupportList.indexOf('dataChannel') === -1){
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
	}
}

RTC.prototype.fileShareSetting = function(){
	
	var rtc = this;
	
	rtc.enables.fileShare = rtc.enables.fileShare.exact || rtc.enables.fileShare;
	
	if(rtc.enables.fileShare instanceof jQuery){
		rtc.enables.fileShare = rtc.enables.fileShare[0];
	}
	
	rtc.conn.filesContainer = rtc.enables.fileShare;
}

RTC.prototype.canvasShareSetting = function(){
	
	var rtc = this;
	
	var designer = new CanvasDesigner();
		
	designer.widgetHtmlURL = path + '/node_modules/canvas-designer/widget.html';
	designer.widgetJsURL = path + '/node_modules/canvas-designer/widget.js';
	
	// ## share coding env
	// designer.widgetHtmlURL = path + '/js/custom/canvas-designer/widget.html';
	// designer.widgetJsURL = path + '/js/custom/canvas-designer/widget.js';
	
	designer.setSelected('pencil');
	
	designer.setTools({
		pencil: true,
		eraser: true,
		image: false,
		pdf: false,
		text: false,
		line: false,
		arrow: false,
		dragSingle: false,
		dragMultiple: false,
		arc: false,
		rectangle: false,
		quadratic: false,
		bezier: false,
		marker: false,
		zoom: false,
		lineWidth: false,
		colorsPicker: true,
		extraOptions: false,
		code: false,
		undo: false
	});
		
	rtc.enables.canvas = rtc.enables.canvas.exact || rtc.enables.canvas;
	
	if(rtc.enables.canvas instanceof jQuery){
		rtc.enables.canvas = rtc.enables.canvas[0];
	}

	designer.appendTo(rtc.enables.canvas);
	
	designer.addSyncListener(function(data) {
		rtc.conn.send({canvas: true, data: data});
	});
	
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
						console.error('audio output error : ', error);
					});;
				}
				
			}
			
			stream.getTracks().forEach(function(track){
				if(device.kind !== 'audiooutput' && device.deviceId === track.getSettings().deviceId){
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
	var height = stream.getVideoTracks()[0].getSettings().height;
	
	for ( var index in rtc.resolutions ){
		
		var resolution = rtc.resolutions[index];
		
		optimalList.push(resolution);
		
		if(resolution.width === width && resolution.height === height){
			isOpt = true;
			break;
		}
	}
	
	if(!isOpt){
		optimalList = [];
		
		optimalList.push({label: 'high', width: width, height: height});
		
		optimalList.push({label: 'midle', width: Math.floor(width/3*2), height: Math.floor(height/3*2)});
		
		optimalList.push({label: 'low', width: Math.floor(width/3), height: Math.floor(height/3)});
	}
	
	var elements = {}, values = [], select, defaultOp;
	
	elements.id = stream.streamid;
	
	defaultOp = document.createElement('option');
	
	defaultOp.text = '해상도 선택';
	
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
		
		if(width === opt.width && height === opt.height){
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
	// intervalTime, constraints
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
	
	// multiStreamRecorder.mimeType = 'video/webm;codecs=vp9';
	// multiStreamRecorder.mimeType = 'video/mp4;codecs=h264';
	multiStreamRecorder.mimeType = 'video/x-matroska;codecs=avc1';
	
	multiStreamRecorder.ondataavailable = function(blob){
		
		var timestamp = new Date().getTime();

		console.log(blob);
		
		if(!!!data || !!data && !!!data.intervalTime){
			
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
			
			rtc.mediaCaptureErrorHandler(error, true);
			
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
					
					rtc.mediaCaptureErrorHandler(error, true);
					
					callback(mediaStream);
					
				});
				
			} else {
				callback(mediaStream);
			}
			
		}).catch(function(error){
			
			rtc.mediaCaptureErrorHandler(error, false);
			
			if(rtc.initConnection){
				
				// 브라우저 최초접속 에러방지
				navigator.mediaDevices.ondevicechange = function (event){
					rtc.openOrJoin(rtc.conn.userid, rtc.conn.sessionid, rtc.permission);
				};
				
			}
			
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
			
			rtc.mediaCaptureErrorHandler(error, false);
			
		});
		
	}else if(navigator.userAgent.indexOf('Chrome') !== -1){
		
		getChromeExtensionStatus('hgpahehaffcbhjfccbhmdfehkokciibh', function(status) {
			
			if(status == 'installed-enabled') {
				
				// 스크린 재공유 Screen-Capturing sourceId 초기화
				
				sourceId =  null; 
				
				getScreenConstraints(function(error, screen_constraints) {
					
					if (error) {
						console.log(error);
						return 
					}

					if(screen_constraints.canRequestAudioTrack) {
						navigator.mediaDevices.getUserMedia({
							video: screen_constraints,
							audio: screen_constraints
						}).then(function(stream) {
							callback(stream);
						}).catch(function(error){
							rtc.mediaCaptureErrorHandler(error, false);
						});
					} else {
						navigator.mediaDevices.getUserMedia({
							video: screen_constraints
						}).then(function(stream) {
							callback(stream);
						}).catch(function(error){
							rtc.mediaCaptureErrorHandler(error, false);
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
				rtc.mediaCaptureErrorHandler(error, true);
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
		rtc.conn.replaceTrack(oTrack, nTrack, null, isVideo);
		
		stream.addTrack(nTrack);
		
		stream.removeTrack(oTrack);
		
		stream.play();

		rtc.deviceSetting(stream);
		
		if(isVideo){
			rtc.resolutionSetting(stream);
		}
	});
}

// 해상도 변경
RTC.prototype.resolutionChange = function(stream, value){
	var rtc = this;
	
	value = value.split('x');
	
	var track = stream.getVideoTracks()[0];

	track.applyConstraints({
		width : value[0],
		height : value[1]
	});
}

//##############################################
//
// External Event 
//
//##############################################
RTC.prototype.screenShare = function(){
	
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
			
			rtc.conn.replaceTrack(oldVideoTrack, newVideoTrack, null, true);
			
			rtc.screen.removeTrack(oldVideoTrack);
			
			rtc.screen.addTrack(newVideoTrack);
			
			oldVideoTrack.enabled = false;
			
			oldVideoTrack.stop();
			
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
		}
	});
}

RTC.prototype.fileShare = function(){
	
	var rtc = this;
	
	if(rtc.remoteStreams.length === 0){
		
		alert('파일을 공유할 유저가 없습니다.');
		
		return;
	}
	
	var fileSelector = new FileSelector();
	
	fileSelector.selectSingleFile(function(file) {
		rtc.conn.send(file);
	});
}

// 스트림 중지 & 스타트 (원격 & 로컬[ 사용자 조작, 권한 조작(공유 중지) 이벤트 ])
RTC.prototype.stopOrStart = function(streamId, isVideo, param){
	if(!!param && !!param.rtc){
		// Remote Stream Controller
		var rtc = param.rtc;
		var enabled = param.enabled;
		
		if(!!rtc.video && streamId === rtc.video.streamid){
			
			isVideo ? rtc.video.getVideoTracks()[0].enabled = enabled : rtc.video.getAudioTracks()[0].enabled = enabled ;
			
		} else if(!!rtc.screen && streamId === rtc.screen.streamid){
			
			isVideo ? rtc.screen.getVideoTracks()[0].enabled = enabled : rtc.screen.getAudioTracks()[0].enabled = enabled;
			
		} else {
			
			rtc.remoteStreams.forEach(function(stream){
				
				if(streamId === stream.streamid){
					
					isVideo ? stream.getVideoTracks()[0].enabled = enabled : stream.getAudioTracks()[0].enabled = enabled;
					
				}
				
			});
			
		}

	}else {
		// Local Stream
		var rtc = this;
		
		var enabled;
		
		var videoElement = document.getElementById(streamId);
		
		var track = isVideo ? videoElement.srcObject.getVideoTracks()[0] : videoElement.srcObject.getAudioTracks()[0];
		
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

// Custom Message Override
RTC.prototype.onMessage = function(msg){
	
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