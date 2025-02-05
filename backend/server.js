const express = require('express');
// const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const Channel = require('./models/channel');

const fs = require('fs');
const https = require('https');

require('dotenv').config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const privateKey = fs.readFileSync('../certs/localhost+2-key.pem', 'utf8');
const certificate = fs.readFileSync('../certs/localhost+2.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials, app);

// const io = require('socket.io')(server);

// Initialize HTTP server
// const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("New user connected");

    socket.on("user-speaking", (userId) => {
      console.log(`${userId} is speaking`);
      // Broadcast this information to other users in the same channel
      socket.broadcast.emit("user-speaking", userId); 
    });

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
      const { channelId } = data;
      console.log(`${socket.id} is joining channel: ${channelId}`);
  
      // Find or create the channel
      let channel = await Channel.findOne({ name: channelId });
  
      if (!channel) {
        // If the channel doesn't exist, create it
        channel = new Channel({
          name: channelId,
          users: [socket.id],
        });
      } else {
        // If the channel exists, add the user to the channel
        channel.users.push(socket.id);
      }
  
      await channel.save();  // Persist changes in MongoDB
  
      // Add user to the socket room for the channel
      socket.join(channelId);
  
      // Emit to all users in the channel that a new user has joined
      socket.to(channelId).emit("user-joined", channel.users);
  
      // Emit the current list of users in the channel to the joined user
      socket.emit("channel-users", channel.users);
    });
  
    // Handle user leaving a channel
    socket.on("leave-channel", async (data) => {
      const { channelId } = data;
      console.log(`${socket.id} is leaving channel: ${channelId}`);
  
      // Find the channel
      let channel = await Channel.findOne({ name: channelId });
  
      if (channel) {
        // Remove the user from the channel
        channel.users = channel.users.filter((id) => id !== socket.id);
        await channel.save();
  
        // Emit to other users that a user has left the channel
        socket.to(channelId).emit("user-left", channel.users);
  
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
    socket.on("disconnect", async () => {
      console.log("User disconnected");
      // Find all channels where this user is present
      const channels = await Channel.find({ users: socket.id });

      for (const channel of channels) {
          // Remove the user from the channel
          channel.users = channel.users.filter(userId => userId !== socket.id);
          await channel.save();

          // Notify remaining users in the channel
          socket.to(channel.name).emit("user-left", {});

          // Leave the socket.io room for this channel
          socket.leave(channel.name);
      }

      console.log(`Removed user ${socket.id} from all channels`);
    });

});  

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`HTTPS Server running on port ${PORT}`));
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running at http://0.0.0.0:${PORT}`);
// });
