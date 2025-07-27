 // backend/routes/public.js
    const express = require('express');
    const router = express.Router();
    const { db } = require('../server'); // Import the database connection container

    // @route   GET /api/books
    // @desc    Get all books (Publicly accessible)
    // @access  Public
    router.get('/', async (req, res) => {
        try {
            const [rows] = await db.mysqlPool.execute('SELECT * FROM books');
            res.json(rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   GET /api/books/:id
    // @desc    Get a single book by ID (Publicly accessible)
    // @access  Public
    router.get('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.mysqlPool.execute('SELECT * FROM books WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Book not found' });
            }
            res.json(rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    module.exports = router;
    