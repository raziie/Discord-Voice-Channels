const express = require("express");
const router = express.Router();
const Channel = require("../models/channel");

// Create a Channel
router.post("/create", async (req, res) => {
  const { name } = req.body;
  try {
    const existingChannel = await Channel.findOne({ name });
    if (existingChannel) return res.status(400).json({ error: "Channel exists" });

    const newChannel = new Channel({ name, users: [] });
    await newChannel.save();
    res.status(201).json(newChannel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Channels
router.get("/", async (req, res) => {
  try {
    const channels = await Channel.find();
    console.log(channels);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join a Channel
router.post("/join", async (req, res) => {
  const { channelName, username } = req.body;
  try {
    const channel = await Channel.findOneAndUpdate(
      { name: channelName },
      { $addToSet: { users: username } },
      { new: true }
    );
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave a Channel
router.post("/leave", async (req, res) => {
  const { channelName, username } = req.body;
  try {
    const channel = await Channel.findOneAndUpdate(
      { name: channelName },
      { $pull: { users: username } },
      { new: true }
    );
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
