// backend/routes/public.js - Updated for MongoDB
    const express = require('express');
    const router = express.Router();
    // const db = require('../server').db; // REMOVED: No longer directly importing db.mysqlPool

    // Import MongoDB Book Model
    const Book = require('../models/Book');

    // @route   GET /api/books
    // @desc    Get all books (public access)
    // @access  Public
    router.get('/', async (req, res) => {
        try {
            // Fetch all books from MongoDB
            const books = await Book.find({}); // Find all documents in the Book collection
            res.json(books);
        } catch (err) {
            console.error('Error fetching books:', err);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // @route   GET /api/books/:id
    // @desc    Get single book by ID (public access)
    // @access  Public
    router.get('/:id', async (req, res) => {
        try {
            // Find book by ID in MongoDB
            const book = await Book.findById(req.params.id);

            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }
            res.json(book);
        } catch (err) {
            console.error('Error fetching single book:', err);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    module.exports = router;
    
