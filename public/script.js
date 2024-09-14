const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideoContainer = document.getElementById('remoteVideoContainer');
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const chatModal = document.getElementById('chatModal');

let localStream;
const peers = {}; // Track peer connections

// Initialize WebRTC
async function startVideo() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  // Notify server that a new user has joined
  socket.emit('new user');
  
  socket.on('user connected', async (userId) => {
    createPeerConnection(userId);
  });

  socket.on('offer', async (userId, offer) => {
    await peers[userId].setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peers[userId].createAnswer();
    await peers[userId].setLocalDescription(answer);
    socket.emit('answer', userId, answer);
  });

  socket.on('answer', async (userId, answer) => {
    await peers[userId].setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on('candidate', async (userId, candidate) => {
    try {
      await peers[userId].addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('Error adding received ICE candidate', e);
    }
  });

  socket.on('user disconnected', (userId) => {
    if (peers[userId]) {
      peers[userId].close();
      delete peers[userId];
      const remoteVideo = document.getElementById(`remoteVideo-${userId}`);
      if (remoteVideo) {
        remoteVideoContainer.removeChild(remoteVideo.parentNode);
      }
    }
  });
}

startVideo();

function createPeerConnection(userId) {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    let remoteVideo = document.getElementById(`remoteVideo-${userId}`);
    if (!remoteVideo) {
      remoteVideo = document.createElement('video');
      remoteVideo.id = `remoteVideo-${userId}`;
      remoteVideo.autoplay = true;
      remoteVideoContainer.appendChild(remoteVideo);
    }
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', userId, event.candidate);
    }
  };

  peers[userId] = peerConnection;

  // Create an offer and send it to the new user
  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => {
      socket.emit('offer', userId, peerConnection.localDescription);
    })
    .catch(e => console.error(e));
}

// Handle incoming chat messages
function handleChatMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
}

// Send a chat message
sendMessageButton.addEventListener('click', () => {
  const message = messageInput.value;
  if (message.trim()) {
    socket.emit('chat message', message);
    messageInput.value = '';
  }
});

// Open the chat modal
function openChat() {
  chatModal.style.display = 'block';
}

// Close the chat modal
function closeChat() {
  chatModal.style.display = 'none';
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
  if (event.target === chatModal) {
    chatModal.style.display = 'none';
  }
}

// Receive chat messages
socket.on('chat message', handleChatMessage);

// Notify server when a user disconnects
window.addEventListener('beforeunload', () => {
  socket.emit('disconnect');
});

