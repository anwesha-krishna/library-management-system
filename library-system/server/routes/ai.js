const express = require('express');
const router = express.Router();
const { chatWithLibraryAI } = require('../controllers/aiController');

router.post('/chat', chatWithLibraryAI);

module.exports = router;