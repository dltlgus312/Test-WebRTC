function RTC(enableList){
	
	this.browserNotSupportErrorHandler = function(err){
		if(err == 'webrtc'){
			alert('영상을 지원하지 않는 브라우저 입니다.');
		}else if(err == 'screen'){
			alert('스크린 영상을 지원하지 않는 브라우저입니다.');
		}else if(err == 'recorde'){
			alert('녹화를 지원하지 않는 브라우저 입니다.');
		}else if(err == 'datachannel'){
			alert('데이터 공유를 지원하지 않는 브라우저 입니다.');
		}
	}
	
	this.mediaCaptureErrorHandler = function(err, isAudio){
		console.log("에러 : " + err);
		if(err.name == 'AbortError'){
			alert("카메라가 다른 장치에서 이미 사용 중 입니다.");
		}else if(err.name == 'NotAllowedError'){
			alert("카메라에 대한 권한을 해제 후 사용가능 합니다.");
		}else if(err.name == 'NotFoundError'){
			if(isAudio){
				alert("연결 가능한 오디오가 없습니다.");
			}else {
				alert("연결 가능한 카메라가 없습니다.");
			}
		}else if(err.name == 'NotReadableError'){
			alert("알수없는 오류가 발생했습니다.");
		}else if(err.name == 'SecurityError'){
			alert("HTTP 연결 에러 추정");
		}else if(err.name == 'TypeError'){ 
			alert("모든제약조건이 false 이거나 제약 조건이 비어있음");
		}else {
			alert(err);
		}
	}

	// 호환되지 않는 브라우저 목록
	var notSupportList = [];
	
	this.getBrowserNotSupportList = function(){
		return notSupportList;
	}
	

	// 브라우저 호환성 체크
	navigator.mediaDevices = navigator.mediaDevices || navigator;
	
	if((!!!enableList || !!enableList.webrtc) && !!!navigator.mediaDevices.getUserMedia){
		browserNotSupportErrorHandler('webrtc');
		notSupportList.push('webrtc');
	}

	if((!!!enableList || !!enableList.screen) && !!!navigator.mediaDevices.getDisplayMedia && navigator.userAgent.indexOf('Chrome') === -1 && navigator.userAgent.indexOf('Edge') !== -1){
		browserNotSupportErrorHandler('screen');
		notSupportList.push('screen');
	}
	
	if((!!!enableList || !!enableList.recorde) && window.MediaRecorder === undefined) {
		browserNotSupportErrorHandler('recorde');
		notSupportList.push('recorde');
	}

	if((!!!enableList || !!enableList.datachannel) && !!!new RTCPeerConnection().createDataChannel){
		browserNotSupportErrorHandler('datachannel');
		notSupportList.push('datachannel');
	}
}