// routes/history.js
const router = require('express').Router();
const EventLog = require('../models/EventLog');

// GET /api/history -> derniers événements
router.get('/', async (req,res) => {
  const items = await EventLog.find().sort({ date: -1 }).limit(20);
  res.json(items);
});

module.exports = router;
