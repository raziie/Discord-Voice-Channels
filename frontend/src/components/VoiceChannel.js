import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import './style.css';

const socket = io("http://localhost:5000");
// const socket = io("http://192.168.1.52:5000");

let localStream;

const VoiceChannelApp = () => {
  const [channelName, setChannelName] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [channelId, setChannelId] = useState("");
  // const [userId] = useState(Math.random().toString(36).substring(7)); // Random user ID
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
  }, []);

  const handleCreateChannel = (newChannelId) => {
    if (!newChannelId) {
      setErrorText('name is required');
    } else {
      setErrorText('');
      setChannelId(newChannelId);
      socket.emit("join-channel", { channelId: newChannelId });
    }
  };

  const handleJoinChannel = (channelId) => {
    setIsMuted(false);
    setChannelId(channelId);
    socket.emit("join-channel", { channelId });
  };

  const handleLeaveChannel = () => {
    setIsMuted(true);
    socket.emit("leave-channel", { channelId });
    setChannelId("");
    setChannelUsers([]);
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev); // Toggle the mute state
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled; // Toggle the track's enabled state
    });
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
            <button key={channel.name} onClick={() => handleJoinChannel(channel.name)}>
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
                  <div className="user-profile"></div>
                  <span className="user-name">{user}</span>
                </div>
              ))}
            </div>
        </div>
      )}

      <audio id="local-audio" muted={isMuted ? true : false} autoPlay={true}></audio>

      <div id="remote-audio-container"></div>

      <button className="mute-button" onClick={handleMuteToggle}>{isMuted ? "Unmute" : "Mute"}</button>
    </div>
  );
};

export default VoiceChannelApp;
