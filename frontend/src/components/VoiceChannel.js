import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import './style.css';

// const socket = io("http://localhost:5000");
const socket = io("https://192.168.1.52:5000");

let localStream;
let peerConnections = {};  // Store peer connections for each user

const VoiceChannelApp = () => {
  const [channelName, setChannelName] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [channelId, setChannelId] = useState("");
  const [channelUsers, setChannelUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [errorText, setErrorText] = useState("");
  const [speakingUser, setSpeakingUser] = useState(null);

  useEffect(() => {
      socket.emit("get-channels");

      const handleChannels = (channels) => {
          setChannels(channels);
      };

      // Handle offer from another user
      const handleOffer = async (offer, fromSocketId) => {
        const peerConnection = createPeerConnection(fromSocketId);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", { to: fromSocketId, answer });
      };

      socket.on("channels", handleChannels);
      socket.on("user-joined", (users) => {
          setChannelUsers(users);
      });
      socket.on("user-left", (users) => {
          setChannelUsers(users);
      });
      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);

      return () => {
        socket.off("channels", handleChannels);
        socket.off("user-joined");
        socket.off("user-left");
        socket.off("offer");
        socket.off("answer");
        socket.off("ice-candidate");
      };
  }, []);

  useEffect(() => {
    // Handle when a user starts speaking
    socket.on("user-speaking", (userId) => {
      console.log(`${userId} is speaking`);
      // Update the UI to highlight the user who is speaking
      // You can manage this using state, for example:
      setSpeakingUser(userId); // Track the currently speaking user
    });
  
    return () => {
      socket.off("user-speaking"); // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    // Get the user's media (audio)
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStream = stream;
        document.getElementById("local-audio").srcObject = stream;
        socket.emit("user-joined", socket.id);  // Emit user joined event

        // Call function to monitor audio levels for this user
        monitorAudio(stream, socket.id); // Track this user's audio levels

        socket.on("user-joined", (users) => {
          console.log(`${socket.id} joined the channel`);
          setChannelUsers(users);
        });

        socket.on("user-left", (users) => {
          console.log(`${socket.id} left the channel`);
          setChannelUsers(users);
        });

        socket.on("channel-users", (users) => {
          setChannelUsers(users);
        });
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [channelUsers]);

  const monitorAudio = (stream, userId) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      // let total = 0;
      // for (let i = 0; i < bufferLength; i++) {
      //   total += dataArray[i];
      // }
      // const averageVolume = total / bufferLength;

      const averageVolume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

      // Threshold for determining if someone is speaking
      const speakingThreshold = 50;

      // console.log(`${averageVolume} avggggggggggggggggggggggggggggggggggggggggggg`);

      if (averageVolume > speakingThreshold) {
        console.log(`${userId} is speaking`);
        socket.emit('user-speaking', userId); // Notify server that this user is speaking
      }
    }, 100); // Check every 100ms
  };

  // Handle channel creation
  const handleCreateChannel = (newChannelId) => {
    if (!newChannelId) {
      setErrorText('Name is required');
    } else {
      setErrorText('');
      setChannelId(newChannelId);
      socket.emit("join-channel", { channelId: newChannelId });
    }
  };

  // Handle user joining a channel
  const handleJoinChannel = (channelId) => {
    setIsMuted(false);
    setChannelId(channelId);
    socket.emit("join-channel", { channelId });
  };

  // Handle user leaving the channel
  const handleLeaveChannel = () => {
    setIsMuted(true);
    socket.emit("leave-channel", { channelId });
    setChannelId("");
    setChannelUsers([]);
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {}; // Cleanup peer connections
  };

  // Handle mute toggle for local audio
  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled; // Toggle the track's enabled state
    });

    // If muting other users, mute their audio element:
    if (speakingUser) {
      const userAudioElement = document.getElementById('remote-user-' + speakingUser); // Get their audio element
      if (userAudioElement) {
        userAudioElement.muted = !userAudioElement.muted; // Mute/unmute their audio
      }
    }
  };

  // Handle answer from another user
  const handleAnswer = (answer, fromSocketId) => {
    const peerConnection = peerConnections[fromSocketId];
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  // Handle ICE candidate
  const handleIceCandidate = (candidate, fromSocketId) => {
    const peerConnection = peerConnections[fromSocketId];
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // Create a new PeerConnection and set up events
  const createPeerConnection = (toSocketId) => {
    const peerConnection = new RTCPeerConnection();

    // Add local audio track to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // On receiving remote track, create a new audio element for the other user
    peerConnection.ontrack = (event) => {
      const remoteAudio = document.createElement('audio');
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.autoplay = true;
      document.getElementById("remote-audio-container").appendChild(remoteAudio);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: toSocketId, candidate: event.candidate });
      }
    };

    peerConnections[toSocketId] = peerConnection;
    return peerConnection;
  };

  return (
    <div>
      <h1>Voice Channel App</h1>

      {!channelId ? (
        <div>
          <h2>Create or Join a Channel</h2>
          <input className="input-name" onChange={(e) => setChannelName(e.target.value)} placeholder="New channel" />
          <span className="error">{errorText}</span>
          <button className="create" onClick={() => handleCreateChannel(channelName)}>Create Channel</button>
          <div className="channel-list">
          {channels.map((channel) => (
            <button className="channel-button" key={channel.name} onClick={() => handleJoinChannel(channel.name)}>
              Join {channel.name} Channel
            </button>
          ))}
          </div>
        </div>
      ) : (
        <div>
          <h2>Joined Channel: {channelId}</h2>
          <button className="leave-button" onClick={handleLeaveChannel}>Leave Channel</button>

          <h3>Users in this Channel</h3>
          <div className="users">
              {channelUsers.map((user) => (
                <div className="user" key={user}>
                  <div className="user-profile">
                  {speakingUser === user && <span className="speaking"> (Speaking)</span>}
                  </div>
                  <span className="user-name">{user}</span>
                </div>
              ))}
            </div>
        </div>
      )}

      {/* <audio id="local-audio" muted={isMuted ? true : false} autoPlay={true}></audio>

      <div id="remote-audio-container"></div>

      <button className="mute-button" onClick={handleMuteToggle}>{isMuted ? "Unmute" : "Mute"}</button> */}


      <audio id="local-audio" muted={isMuted} autoPlay></audio>
      <div id="remote-audio-container"></div>
      <button className="mute-button" onClick={handleMuteToggle}>{isMuted ? "Unmute" : "Mute"}</button>

    </div>
  );
};

export default VoiceChannelApp;
