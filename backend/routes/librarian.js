    // backend/routes/librarian.js
    const express = require('express');
    const router = express.Router();
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const db = require('../server').db; // Import the db object from server.js
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs'); // Node's file system module

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    // Configure multer for file uploads
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDir); // Files will be stored in the 'uploads' directory
        },
        filename: (req, file, cb) => {
            // Create a unique filename: fieldname-timestamp.ext
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });

    const upload = multer({ storage: storage });

    // --- Utility function to generate JWT token ---
    const generateToken = (id, role) => {
        return jwt.sign({ id, role }, process.env.JWT_SECRET, {
            expiresIn: '1h', // Token expires in 1 hour
        });
    };

    // @route   POST /api/librarian/login
    // @desc    Authenticate librarian & get token
    // @access  Public
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            // Fetch librarian from MySQL
            const [rows] = await db.mysqlPool.execute('SELECT * FROM librarians WHERE username = ?', [username]);

            if (rows.length === 0) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const librarian = rows[0];

            // Compare provided password with hashed password
            const isMatch = await bcrypt.compare(password, librarian.password);

            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = generateToken(librarian.id, 'librarian');

            res.json({ message: 'Login successful', token, role: 'librarian' });

        } catch (err) {
            console.error('Librarian login error:', err);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // --- Middleware to protect routes ---
    const protect = (req, res, next) => {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded; // Attach user info to request
                next();
            } catch (error) {
                console.error('Token verification error:', error);
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token expired' });
                }
                res.status(401).json({ message: 'Token is not valid' });
            }
        }
        if (!token) {
            res.status(401).json({ message: 'No token, authorization denied' });
        }
    };

    // @route   POST /api/librarian/books
    // @desc    Add a new book
    // @access  Private (Librarian only)
    router.post('/books', protect, upload.single('coverImage'), async (req, res) => {
        const { title, author, isbn, published_date, description, shelf_number, row_position } = req.body;
        const cover_image_url = req.file ? `/uploads/${req.file.filename}` : null; // Store relative path

        // Basic validation
        if (!title || !author || !isbn || !published_date) {
            return res.status(400).json({ message: 'Please enter all required fields: title, author, ISBN, published date.' });
        }

        try {
            const [result] = await db.mysqlPool.execute(
                'INSERT INTO books (title, author, isbn, published_date, description, cover_image_url, shelf_number, row_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [title, author, isbn, published_date, description, cover_image_url, shelf_number, row_position]
            );
            res.status(201).json({ message: 'Book added successfully!', bookId: result.insertId, cover_image_url });
        } catch (err) {
            console.error('Error adding book:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Book with this ISBN already exists.' });
            }
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // @route   PUT /api/librarian/books/:id
    // @desc    Update a book
    // @access  Private (Librarian only)
    router.put('/books/:id', protect, upload.single('coverImage'), async (req, res) => {
        const bookId = req.params.id;
        const { title, author, isbn, published_date, description, shelf_number, row_position } = req.body;
        let cover_image_url = req.body.cover_image_url; // Existing URL if not uploading new

        try {
            // Fetch current book data to handle image update/deletion
            const [currentBookRows] = await db.mysqlPool.execute('SELECT cover_image_url FROM books WHERE id = ?', [bookId]);
            const currentCoverImagePath = currentBookRows.length > 0 ? currentBookRows[0].cover_image_url : null;

            if (req.file) { // New image uploaded
                cover_image_url = `/uploads/${req.file.filename}`;
                // Delete old image if it exists
                if (currentCoverImagePath && currentCoverImagePath.startsWith('/uploads/')) {
                    const oldImagePath = path.join(__dirname, '..', currentCoverImagePath);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
            } else if (req.body.clearCoverImage === 'true' || req.body.cover_image_url === '') { // Explicitly clear image
                cover_image_url = null;
                if (currentCoverImagePath && currentCoverImagePath.startsWith('/uploads/')) {
                    const oldImagePath = path.join(__dirname, '..', currentCoverImagePath);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
            } else {
                // If no new file and not explicitly clearing, retain existing URL from currentBookRows
                cover_image_url = currentCoverImagePath;
            }


            const [result] = await db.mysqlPool.execute(
                'UPDATE books SET title = ?, author = ?, isbn = ?, published_date = ?, description = ?, cover_image_url = ?, shelf_number = ?, row_position = ? WHERE id = ?',
                [title, author, isbn, published_date, description, cover_image_url, shelf_number, row_position, bookId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Book not found' });
            }
            res.json({ message: 'Book updated successfully!' });
        } catch (err) {
            console.error('Error updating book:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Book with this ISBN already exists.' });
            }
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // @route   DELETE /api/librarian/books/:id
    // @desc    Delete a book
    // @access  Private (Librarian only)
    router.delete('/books/:id', protect, async (req, res) => {
        const bookId = req.params.id;

        try {
            // Fetch book to get cover image path before deleting
            const [bookRows] = await db.mysqlPool.execute('SELECT cover_image_url FROM books WHERE id = ?', [bookId]);
            const cover_image_url = bookRows.length > 0 ? bookRows[0].cover_image_url : null;

            const [result] = await db.mysqlPool.execute('DELETE FROM books WHERE id = ?', [bookId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Book not found' });
            }

            // Delete the associated cover image file if it exists
            if (cover_image_url && cover_image_url.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, '..', cover_image_url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            res.json({ message: 'Book deleted successfully!' });
        } catch (err) {
            console.error('Error deleting book:', err);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    module.exports = router;
