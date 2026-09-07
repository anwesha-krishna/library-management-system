const { Parser } = require('json2csv');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

// POST /api/transactions/issue
exports.issueBook = async (req, res) => {
  try {
    const { bookId, borrowerName, issueDate } = req.body;
    if (!bookId || !borrowerName) {
      return res.status(400).json({ error: 'bookId and borrowerName are required.' });
    }

    const book = await Book.findOne({ bookId });
    if (!book) return res.status(404).json({ error: 'Invalid book ID / QR code.' });

    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: 'This book is already fully issued.' });
    }

    book.availableCopies -= 1;
    await book.save();

    const recordIssueDate = issueDate ? new Date(issueDate) : new Date();

    const transaction = await Transaction.create({
      book: book._id,
      bookId: book.bookId,
      bookTitle: book.title,
      borrowerName,
      issueDate: recordIssueDate,
      returnDate: null,
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/transactions/return
exports.returnBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: 'bookId is required.' });

    const book = await Book.findOne({ bookId });
    if (!book) return res.status(404).json({ error: 'Invalid book ID / QR code.' });

    const openTransaction = await Transaction.findOne({ bookId, returnDate: null }).sort({
      issueDate: 1,
    });

    if (!openTransaction) {
      return res.status(400).json({ error: 'No active issue found for this book.' });
    }

    openTransaction.returnDate = new Date();
    await openTransaction.save();

    if (book.availableCopies < book.totalCopies) {
      book.availableCopies += 1;
      await book.save();
    }

    res.json(openTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ issueDate: -1 });

    const updatedTransactions = transactions.map((t) => {
      const doc = t.toObject();
      if (!doc.returnDate) {
        const issueTime = new Date(doc.issueDate).getTime();
        const now = new Date().getTime();
        const daysElapsed = Math.floor((now - issueTime) / (1000 * 60 * 60 * 24));
        
        const maxAllowedDays = 14;
        doc.overdueDays = daysElapsed > maxAllowedDays ? daysElapsed - maxAllowedDays : 0;
        doc.isOverdue = daysElapsed > maxAllowedDays;
      } else {
        doc.overdueDays = 0;
        doc.isOverdue = false;
      }
      return doc;
    });

    res.json(updatedTransactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/transactions/export
exports.exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ issueDate: -1 }).lean();

    const rows = transactions.map((t) => ({
      'Book Title': t.bookTitle,
      'Book ID': t.bookId,
      'Issued To': t.borrowerName,
      'Issue Timestamp': t.issueDate ? t.issueDate.toISOString() : '',
      'Return Timestamp': t.returnDate ? t.returnDate.toISOString() : '',
      'Current Status': t.returnDate ? 'Returned' : 'Issued',
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('issue-return-history.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/transactions/clear
exports.clearTransactions = async (req, res) => {
  try {
    await Transaction.deleteMany({ returnDate: { $ne: null } });
    res.json({ message: 'Cleared returned transaction history.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};