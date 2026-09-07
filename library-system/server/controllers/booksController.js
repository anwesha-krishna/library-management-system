const QRCode = require('qrcode');
const Book = require('../models/Book');

// Generates a short unique ID for a new book, e.g. BK-7F3A1C
function generateBookId() {
  return 'BK-' + Math.random().toString(16).slice(2, 8).toUpperCase();
}

// POST /api/books  — add a new book, auto-generate its QR code
exports.addBook = async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required.' });
    }

    const bookId = generateBookId();
    const copies = Number(totalCopies) > 0 ? Number(totalCopies) : 1;

    // The QR code simply encodes the bookId — the scanner just needs
    // to read this string and send it to the issue/return endpoints.
    const qrCodeDataUrl = await QRCode.toDataURL(bookId);

    const book = await Book.create({
      bookId,
      title,
      author,
      isbn,
      category,
      totalCopies: copies,
      availableCopies: copies,
      qrCodeDataUrl,
    });

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/books?title=&author=&category=&status=
exports.getBooks = async (req, res) => {
  try {
    const { title, author, category, status } = req.query;
    const filter = {};

    if (title) filter.title = { $regex: title, $options: 'i' };
    if (author) filter.author = { $regex: author, $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };

    let books = await Book.find(filter).sort({ createdAt: -1 });

    // status is a virtual, so filter it in JS after the DB query
    if (status === 'Available') books = books.filter((b) => b.availableCopies > 0);
    if (status === 'Issued') books = books.filter((b) => b.availableCopies === 0);

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/books/:bookId  — look up a single book by its bookId (used after a QR scan)
exports.getBookByBookId = async (req, res) => {
  try {
    const book = await Book.findOne({ bookId: req.params.bookId });
    if (!book) return res.status(404).json({ error: 'No book found for this QR code.' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
