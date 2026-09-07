const express = require('express');
const router = express.Router();
const {
  addBook,
  getBooks,
  getBookByBookId,
  deleteBook,
} = require('../controllers/booksController');

router.post('/', addBook);
router.get('/', getBooks);
router.get('/:bookId', getBookByBookId);
router.delete('/:id', deleteBook);

module.exports = router;
