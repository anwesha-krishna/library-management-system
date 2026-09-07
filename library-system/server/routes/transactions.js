const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getTransactions,
  exportTransactions,
  clearTransactions,
} = require('../controllers/transactionsController');

router.post('/issue', issueBook);
router.post('/return', returnBook);
router.get('/', getTransactions);
router.get('/export', exportTransactions);
router.delete('/clear', clearTransactions);

module.exports = router;
