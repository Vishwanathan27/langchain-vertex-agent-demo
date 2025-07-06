// Routes for SwarnaAI conversational agent
const express = require('express');
const router = express.Router();
const { swarnaAIAgent } = require('../ai/aiAgent');

router.post('/chat', async (req, res, next) => {
  try {
    const { input, chat_history } = req.body;
    const response = await swarnaAIAgent(input, chat_history || []);
    res.json({ response });
  } catch (err) {
    next(err);
  }
});

module.exports = router;