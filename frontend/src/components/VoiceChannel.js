import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Adjust your server's URL

const VoiceChannel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [chatInputVisible, setChatInputVisible] = useState(false);

  // Socket event listeners
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('user-connected', (userId) => {
      setUsers((prevUsers) => [...prevUsers, userId]);
    });

    socket.on('user-disconnected', (userId) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user !== userId));
    });

    socket.on('chat-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('chat-message');
    };
  }, []);

  const joinChannel = () => {
    socket.emit('join-channel');
    setIsConnected(true);
  };

  const leaveChannel = () => {
    socket.emit('leave-channel');
    setIsConnected(false);
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (message.trim() !== '') {
      socket.emit('chat-message', message);
      setMessage('');
    }
  };

  const handleChatToggle = () => {
    setChatInputVisible(!chatInputVisible);
  };

  return (
    <div className="voice-channel">
      {!isConnected ? (
        <button onClick={joinChannel}>Join Voice Channel</button>
      ) : (
        <div>
          <h2>Voice Channel</h2>
          <button onClick={leaveChannel}>Leave Channel</button>
          <div>
            <h3>Users in Channel:</h3>
            <ul>
              {users.map((user, index) => (
                <li key={index}>{user}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Chat:</h3>
            {chatInputVisible && (
              <form onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            )}
            <button onClick={handleChatToggle}>
              {chatInputVisible ? 'Hide Chat' : 'Show Chat'}
            </button>
            <div>
              {messages.map((msg, index) => (
                <div key={index}>
                  <strong>{msg.user}</strong>: {msg.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChannel;
