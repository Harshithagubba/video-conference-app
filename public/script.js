const socket = io();

// Handle chat messages
const chatBox = document.getElementById('chat');
socket.on('message', (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

function sendMessage() {
    const message = document.getElementById('message').value;
    if (message.trim()) {
        socket.emit('message', message);
        document.getElementById('message').value = '';
    }
}

// Handle video streams
const videoGrid = document.getElementById('videos');
const peerConnections = {};
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        const localVideo = document.createElement('video');
        localVideo.srcObject = stream;
        localVideo.autoplay = true;
        localVideo.classList.add('video');
        videoGrid.appendChild(localVideo);

        socket.on('offer', (offer) => {
            const peerConnection = new RTCPeerConnection(configuration);
            peerConnections[offer.socketId] = peerConnection;

            peerConnection.ontrack = (event) => {
                const remoteVideo = document.createElement('video');
                remoteVideo.srcObject = event.streams[0];
                remoteVideo.autoplay = true;
                remoteVideo.classList.add('video');
                videoGrid.appendChild(remoteVideo);
            };

            peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            peerConnection.addStream(stream);

            peerConnection.createAnswer().then(answer => {
                return peerConnection.setLocalDescription(answer);
            }).then(() => {
                socket.emit('answer', { sdp: peerConnection.localDescription, socketId: offer.socketId });
            });

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { candidate: event.candidate, socketId: offer.socketId });
                }
            };
        });

        socket.on('answer', (answer) => {
            peerConnections[answer.socketId].setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', (candidate) => {
            peerConnections[candidate.socketId].addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.emit('new-user');
    }).catch(error => console.error('Error accessing media devices.', error));









