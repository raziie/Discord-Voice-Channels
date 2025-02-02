import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import './style.css';

// const socket = io("http://localhost:5000");
const socket = io("http://192.168.1.53:5000");

let localStream;

const VoiceChannelApp = () => {
  const [channelName, setChannelName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [userId] = useState(Math.random().toString(36).substring(7)); // Random user ID
  const [channelUsers, setChannelUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [errorText, setErrorText] = useState("");

    useEffect(() => {
        socket.emit("get-channels");

        const handleChannels = (channels) => {
            setChannels(channels);
        };

        socket.on("channels", handleChannels);

        return () => {
        socket.off("channels", handleChannels); // Cleanup listener on unmount
        };
    }, []);

  useEffect(() => {
    // Get the user's media (audio)
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStream = stream;
        document.getElementById("local-audio").srcObject = stream;

        socket.on("user-joined", (data) => {
          console.log(`${data.userId} joined the channel`);
          setChannelUsers((prev) => [...prev, data.userId]);
        });

        socket.on("user-left", (data) => {
          console.log(`${data.userId} left the channel`);
          setChannelUsers((prev) => prev.filter((id) => id !== data.userId));
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
  }, []);

  const handleCreateChannel = (newChannelId) => {
    if (!newChannelId) {
      setErrorText('name is required');
    } else {
      setErrorText('');
      setChannelId(newChannelId);
      socket.emit("join-channel", { channelId: newChannelId, userId });
    }
  };

  const handleJoinChannel = (channelId) => {
    setChannelId(channelId);
    socket.emit("join-channel", { channelId, userId });
  };

  const handleLeaveChannel = () => {
    socket.emit("leave-channel", { channelId, userId });
    setChannelId("");
    setChannelUsers([]);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    localStream.getAudioTracks().forEach((track) => (track.enabled = !isMuted));
  };

  return (
    <div>
      <h1>Voice Channel App</h1>

      {!channelId ? (
        <div>
          <h2>Create or Join a Channel</h2>
          <input onChange={(e) => setChannelName(e.target.value)} placeholder="New channel" />
          <span className="error">{errorText}</span>
          <button onClick={() => handleCreateChannel(channelName)}>Create Channel</button>
          <div className="channel-list">
          {channels.map((channel) => (
            <button key={channel.name} onClick={() => handleJoinChannel(channel.name)}>
              Join {channel.name} Channel
            </button>
          ))}
          </div>
        </div>
      ) : (
        <div>
          <h2>Joined Channel: {channelId}</h2>
          <button onClick={handleLeaveChannel}>Leave Channel</button>

          <h3>Users in this Channel</h3>
          <ul>
          {channelUsers.map((user) => (
            <li key={user}>{user}</li>
          ))}
          </ul>
        </div>
      )}

      <audio id="local-audio" muted autoPlay></audio>

      <div id="remote-audio-container"></div>

      <button onClick={handleMuteToggle}>{isMuted ? "Unmute" : "Mute"}</button>
    </div>
  );
};

export default VoiceChannelApp;
