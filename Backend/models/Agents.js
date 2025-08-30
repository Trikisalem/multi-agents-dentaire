// models/Agent.js
const mongoose = require('mongoose');
const AgentSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Agent', AgentSchema);

// models/EventLog.js
const mongoose = require('mongoose');
const EventLogSchema = new mongoose.Schema({
  text: { type: String, required: true },
  date: { type: Date,   default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model('EventLog', EventLogSchema);
