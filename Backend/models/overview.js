// routes/overview.js
const router = require('express').Router();
const EventLog = require('../models/EventLog');

router.get('/', async (req,res) => {
  // Exemple: calculez à partir de la base; ici valeurs fictives + logs
  const calls  = 1234;
  const emails = 567;
  const tasks  = 89;
  res.json({ calls, emails, tasks });
});

module.exports = router;
