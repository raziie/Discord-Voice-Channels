import logo from './logo.svg';
import React from 'react';
import './App.css';
import VoiceChannel from './components/VoiceChannel';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <h1>Discord-like Voice Channel</h1>
      <VoiceChannel />
    </div>
  );
}

export default App;
