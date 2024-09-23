const express = require('express');
const router = express.Router();
const { getChatGPTResponse } = require('../controllers/chatgpt.controller');

router.post('/chatgpt', getChatGPTResponse);

module.exports = router;