function RTC(enableList){

	if(!!!enableList) {
		enableList = [];
		enableList.datachannel = true;
		enableList.canvas = true;
		enableList.fileShare = true;
		enableList.screen = true;
		enableList.recorde = true;
	}

	if(!!enableList.canvas || !!enableList.fileshare){
		enableList.datachannel = true;
	}


	var notSupportList = [];

	this.getBrowserNotSupportList = function(){
		return notSupportList;
	}


	this.onBrowserNotSupportError = function(err){
		if(err === 'all'){
			alert('다른브라우저를 이용해주세요');
		}else if(err === 'webrtc'){
			alert('영상을 지원하지 않는 브라우저 입니다.');
		}else if(err === 'screen'){
			alert('스크린 영상을 지원하지 않는 브라우저입니다.');
		}else if(err === 'recorde'){
			alert('녹화를 지원하지 않는 브라우저 입니다.');
		}else if(err === 'datachannel'){
			alert('데이터 공유를 지원하지 않는 브라우저 입니다.');
		}
	}

	this.onMediaCaptureError = function(err, isAudio){
		if(err === 'AbortError'){
			alert("카메라가 다른 장치에서 이미 사용 중 입니다.");
		}else if(err === 'NotAllowedError'){
			alert("카메라에 대한 권한을 해제 후 사용가능 합니다.");
		}else if(err === 'NotFoundError'){
			if(!!isAudio){
				alert("연결 가능한 오디오가 없습니다.");
			}else {
				alert("연결 가능한 카메라가 없습니다.");
			}
		}else if(err === 'NotReadableError'){
			alert("알수없는 오류가 발생했습니다.");
		}else if(err === 'SecurityError'){
			alert("HTTPS가 아닌 연결 에러");
		}else if(err === 'TypeError'){ 
			// alert("모든제약조건이 false 이거나 제약 조건이 비어있음");
			alert("알수없는 에러");
		}else {
			alert(err);
		}
	}

	this.browserNotSupportErrorHandler = function (){
		
		if(!!!window.RTCPeerConnection){
			onBrowserNotSupportError('all');
			notSupportList.push('all');
		}
		
		// 브라우저 호환성 체크
		navigator.mediaDevices = navigator.mediaDevices || navigator;
		
		if(!!!navigator.mediaDevices.getUserMedia){
			onBrowserNotSupportError('webrtc');
			notSupportList.push('webrtc');
		}
		
		
		if(!!enableList.screen && !!!navigator.mediaDevices.getDisplayMedia && navigator.userAgent.indexOf('Chrome') === -1 && navigator.userAgent.indexOf('Edge') !== -1){
			onBrowserNotSupportError('screen');
			notSupportList.push('screen');
		}
		
		if(!!enableList.recorde && window.MediaRecorder === undefined) {
			onBrowserNotSupportError('recorde');
			notSupportList.push('recorde');
		}
		

		if(enableList.dataChannel && !!!new RTCPeerConnection().createDataChannel){
			onBrowserNotSupportError('datachannel');
			notSupportList.push('datachannenableListel');
		}
	}

	this.mediaCaptureErrorHandler = function(err, isAudio){
		console.error("에러 : " + err);
		
		if(isAudio && err.name === 'NotFoundError'){
			onMediaCaptureError(err.name, true);
		}else {
			onMediaCaptureError(err.name, false);
		}
	}


	this.onstream = function(event) {
		var container;
		var screenBtn = document.getElementById("screenShare");
		if(connection.isInitiator){
			<!-- alert("당신은 방의 주인입니다."); -->
			permission = 'super';
			screenBtn.disabled = false;
			screenBtn.innerHTML = '화면공유';
		}else {				
			permission = 'user';
			screenBtn.disabled = true;
			screenBtn.innerHTML = '방장권한';
		}
	
		if(event.stream.isScreen){
			// ## ended >> src = ''
			document.getElementById("screenShare").disabled = true;
			container = document.getElementById('screen-container');
			container.innerHTML  = "";
		}else {			
			container = document.getElementById('video-container');
		}
		
		event.mediaElement.status = 'play';
		event.mediaElement.controls = false;
		container.appendChild( event.mediaElement );
		event.mediaElement.play();
		
		if(permission == 'super'){
			document.getElementById(event.mediaElement.id).onclick = function(){
					if(event.mediaElement.status === 'play'){
						event.mediaElement.status = 'stop';
						connection.send({streamClose : true, id : event.mediaElement.id});
					}
					else {
						event.mediaElement.status = 'play';
						connection.send({streamOpen : true, id : event.mediaElement.id});
					}
			}
			if(!multiStreamRecorder){
				<!-- alert("SERVER 녹화 진행"); -->
				<!-- recorde(); -->
				if(window.MediaRecorder !== undefined) {
					multiRecorde();
				}else {					
					alert('녹화가 불가능한 브라우저 입니다.');
				}
			}
		}
	};
	
	this.onopen = function(event) {
		if (designer.pointsLength <= 0) {
			setTimeout(function() {
				connection.send('plz-sync-points');
			}, 1000);
		}
	};
	
	this.onRoomFull = function(err) {
		alert('방이 꽉 찼습니다. \n ERROR : ' + err);
	};
	
	this.onleave = function(event){
		// event.userid, event.extra // 한번 호출
	}
	
	this.onstreamended = function(event) {
		if (!event.mediaElement) {
			event.mediaElement = document.getElementById(event.streamid);
		}
		
		if (!event.mediaElement || !event.mediaElement.parentNode) {
			location.reload();
			return;
		}
		
		event.mediaElement.parentNode.removeChild(event.mediaElement);
	};
	
	
	// ###### Initial Setting ######
	
	var connection, permission, mRecorder, lRecorder;
	
	var stunOption = {
		urls: 'stun:192.168.25.4:3478'
	}
	
	var turnOption = {
		urls: 'turn:211.44.246.219:3478?transport=tcp',
		credential: 'test',
		username: 'test'
	};
	
	var session = {
		data: !!enableList.dataChannel
	}
	
	connection = new RTCMultiConnection();
		
	connection.socketURL = '/';
	
	connection.dontCaptureUserMedia = true;
	
	connection.maxParticipantsAllowed = 2;
	
	connection.iceServers = [];
	
	connection.iceServers.push(stunOption);

	connection.iceServers.push(turnOption);
	
	connection.session = session;
	
	connection.enableFileSharing = !!enableList.fileshare;
	
	connection.onstream = onstream;
	
	connection.onopen = onopen;
		
	connection.onRoomFull = onRoomFull;
	
	connection.onleave = onleave;
	
	connection.onstreamended = onstreamended;
	
}