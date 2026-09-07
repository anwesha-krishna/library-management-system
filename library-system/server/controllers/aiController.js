const { GoogleGenAI } = require('@google/genai');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

exports.chatWithLibraryAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Fetch live system context
    const books = await Book.find({});
    const transactions = await Transaction.find({}).populate('bookId');

    const systemContext = `
You are the AI Assistant for a Library Management System.
Answer questions based on this live library data:

BOOKS CATALOG:
${JSON.stringify(books, null, 2)}

ACTIVE TRANSACTIONS:
${JSON.stringify(transactions, null, 2)}

Be concise, clear, and accurate.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemContext}\n\nUser Question: ${prompt}` }]
        }
      ]
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI response' });
  }
};