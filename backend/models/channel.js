const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    users: [String],
});

module.exports = mongoose.model('Channel', ChannelSchema);
