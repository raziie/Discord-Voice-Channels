const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const Channel = require('./models/channel');

require('dotenv').config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize HTTP server
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("New user connected");

    // Handle finding all channels
    socket.on("get-channels", async () => {
        // Find all channels
        const channels = await Channel.find({});

        if (!channels) {
            // If no channel exists
            channels = []
        }
        // Return a welcome message to the connected client
        socket.emit("channels", channels );

    });
  
    // Handle user joining a channel
    socket.on("join-channel", async (data) => {
      const { channelId, userId } = data;
      console.log(`${userId} is joining channel: ${channelId}`);
  
      // Find or create the channel
      let channel = await Channel.findOne({ name: channelId });
  
      if (!channel) {
        // If the channel doesn't exist, create it
        channel = new Channel({
          name: channelId,
          users: [userId],
        });
      } else {
        // If the channel exists, add the user to the channel
        channel.users.push(userId);
      }
  
      await channel.save();  // Persist changes in MongoDB
  
      // Add user to the socket room for the channel
      socket.join(channelId);
  
      // Emit to all users in the channel that a new user has joined
      socket.to(channelId).emit("user-joined", { userId });
  
      // Emit the current list of users in the channel to the joined user
      socket.emit("channel-users", channel.users);
    });
  
    // Handle user leaving a channel
    socket.on("leave-channel", async (data) => {
      const { channelId, userId } = data;
      console.log(`${userId} is leaving channel: ${channelId}`);
  
      // Find the channel
      let channel = await Channel.findOne({ name: channelId });
  
      if (channel) {
        // Remove the user from the channel
        channel.users = channel.users.filter((id) => id !== userId);
        await channel.save();
  
        // Emit to other users that a user has left the channel
        socket.to(channelId).emit("user-left", { userId });
  
        // Leave the channel room
        socket.leave(channelId);
      }
    });
  
    // WebRTC signaling
    socket.on("offer", (data) => {
      socket.to(data.to).emit("offer", data.offer, socket.id);
    });
  
    socket.on("answer", (data) => {
      socket.to(data.to).emit("answer", data.answer, socket.id);
    });
  
    socket.on("ice-candidate", (data) => {
      socket.to(data.to).emit("ice-candidate", data.candidate, socket.id);
    });
  
    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

});  

const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
