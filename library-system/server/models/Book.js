const mongoose = require('mongoose');

// Each book gets a unique bookId (used to encode the QR code) plus
// a "status" field that flips between Available / Issued whenever
// a transaction happens. totalCopies / availableCopies let a book
// with multiple physical copies still be tracked correctly.
const bookSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true, unique: true }, // e.g. auto-generated or ISBN
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    category: { type: String, trim: true },
    totalCopies: { type: Number, required: true, min: 1, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    qrCodeDataUrl: { type: String }, // base64 PNG data URL of the generated QR code
  },
  { timestamps: true }
);

// Virtual field: a book is "Issued" (fully) only when no copies remain
bookSchema.virtual('status').get(function () {
  return this.availableCopies > 0 ? 'Available' : 'Issued';
});

bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
