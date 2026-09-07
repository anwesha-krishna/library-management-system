const mongoose = require('mongoose');

// One document per issue event. returnDate stays null until the
// book is returned, which is how we know a transaction is "open"
// (currently issued, not yet returned).
const transactionSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    bookId: { type: String, required: true }, // denormalized for fast CSV export / display
    bookTitle: { type: String, required: true },
    borrowerName: { type: String, required: true, trim: true },
    issueDate: { type: Date, default: Date.now },
    returnDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
