let localStream;
let peerConnection;
const servers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' } // Example STUN server
  ]
};

// Signaling functions (replace with your implementation)
const sendToSignalingServer = (message) => {
  // Send message (SDP or ICE candidate) to the signaling server
};

const receiveFromSignalingServer = (callback) => {
  // Listen for messages (SDP or ICE candidate) from the signaling server
  // and invoke the callback with the data
};

export const startVoiceChat = async () => {
  try {
    // Get user media
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create peer connection
    peerConnection = new RTCPeerConnection(servers);

    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle incoming streams (for remote audio)
    peerConnection.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio); // Append audio element to DOM
    };

    // Handle ICE candidates and send them to the signaling server
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendToSignalingServer({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Create an offer to initiate the connection
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send offer to the signaling server
    sendToSignalingServer({
      type: 'offer',
      sdp: offer.sdp
    });
  } catch (error) {
    console.error('Error starting voice chat:', error);
  }
};

export const joinVoiceChat = async (offer) => {
  try {
    // Create peer connection
    peerConnection = new RTCPeerConnection(servers);

    // Handle incoming streams (for remote audio)
    peerConnection.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio); // Append audio element to DOM
    };

    // Handle ICE candidates and send them to the signaling server
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendToSignalingServer({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Set remote description (the offer received)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Get local audio stream
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Create answer to the offer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer to the signaling server
    sendToSignalingServer({
      type: 'answer',
      sdp: answer.sdp
    });
  } catch (error) {
    console.error('Error joining voice chat:', error);
  }
};

export const leaveVoiceChat = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
};

// Listening for ICE candidates from signaling server
receiveFromSignalingServer(async (message) => {
  if (message.type === 'ice-candidate') {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    } catch (error) {
      console.error('Error adding received ICE candidate:', error);
    }
  }
});
