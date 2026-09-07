const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const dns = require('dns');

// Force DNS resolution order for Windows environments
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/books', require('./routes/books'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});