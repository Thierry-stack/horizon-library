const express = require('express');
    const router = express.Router();
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs'); // Node's file system module

    // Import MongoDB Models
    const Librarian = require('../models/Librarian');
    const Book = require('../models/Book');

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

    // @route   POST /api/librarian/create-temp-librarian
    // @desc    Temporary route to create a new librarian for testing
    // @access  Public (REMOVE AFTER USE)
    router.post('/create-temp-librarian', async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        try {
            // Check if librarian already exists
            const existingLibrarian = await Librarian.findOne({ username });
            if (existingLibrarian) {
                return res.status(409).json({ message: 'Librarian with this username already exists.' });
            }

            // Create new librarian using the Mongoose model (password will be hashed by pre-save hook)
            const newLibrarian = new Librarian({ username, password });
            await newLibrarian.save();

            res.status(201).json({ message: 'Temporary librarian created successfully!', username: newLibrarian.username });

        } catch (err) {
            console.error('Error creating temporary librarian:', err);
            res.status(500).json({ message: 'Server Error' });
        }
    });


    // @route   POST /api/librarian/login
    // @desc    Authenticate librarian & get token
    // @access  Public
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            // Find librarian by username in MongoDB
            const librarian = await Librarian.findOne({ username });

            if (!librarian) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Compare provided password with hashed password using Mongoose method
            const isMatch = await librarian.matchPassword(password);

            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = generateToken(librarian._id, 'librarian'); // Use _id for MongoDB documents

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
                req.user = decoded; // Attach user info to request (id and role)
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
            // Delete uploaded file if validation fails
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Please enter all required fields: title, author, ISBN, published date.' });
        }

        try {
            // Check if book with this ISBN already exists
            const existingBook = await Book.findOne({ isbn });
            if (existingBook) {
                // Delete uploaded file if ISBN already exists
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(409).json({ message: 'Book with this ISBN already exists.' });
            }

            const newBook = new Book({
                title,
                author,
                isbn,
                published_date,
                description,
                cover_image_url,
                shelf_number,
                row_position
            });

            const savedBook = await newBook.save();
            res.status(201).json({ message: 'Book added successfully!', bookId: savedBook._id, cover_image_url: savedBook.cover_image_url });
        } catch (err) {
            console.error('Error adding book:', err);
            // Delete uploaded file if other server error occurs
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // @route   PUT /api/librarian/books/:id
    // @desc    Update a book
    // @access  Private (Librarian only)
    router.put('/books/:id', protect, upload.single('coverImage'), async (req, res) => {
        const bookId = req.params.id;
        const { title, author, isbn, published_date, description, shelf_number, row_position } = req.body;
        let cover_image_url_to_update = req.body.cover_image_url; // This might be the old URL or null if cleared

        try {
            const book = await Book.findById(bookId);

            if (!book) {
                // Delete uploaded file if book not found
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ message: 'Book not found' });
            }

            // Handle image update/deletion logic
            const oldCoverImagePath = book.cover_image_url; // Get current image URL from DB

            if (req.file) { // New image uploaded
                cover_image_url_to_update = `/uploads/${req.file.filename}`;
                // Delete old image if it exists and is different from new one
                if (oldCoverImagePath && oldCoverImagePath.startsWith('/uploads/') && oldCoverImagePath !== cover_image_url_to_update) {
                    const oldFilePath = path.join(__dirname, '..', oldCoverImagePath);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }
            } else if (req.body.clearCoverImage === 'true' || req.body.cover_image_url === '') { // Explicitly clear image
                cover_image_url_to_update = null;
                if (oldCoverImagePath && oldCoverImagePath.startsWith('/uploads/')) {
                    const oldFilePath = path.join(__dirname, '..', oldCoverImagePath);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }
            } else {
                // If no new file and not explicitly clearing, retain existing URL from DB
                cover_image_url_to_update = oldCoverImagePath;
            }

            // Update book fields
            book.title = title;
            book.author = author;
            book.isbn = isbn;
            book.published_date = published_date;
            book.description = description;
            book.shelf_number = shelf_number;
            book.row_position = row_position;
            book.cover_image_url = cover_image_url_to_update; // Set the determined image URL

            // Check for duplicate ISBN only if ISBN is changed and it's not the current book's ISBN
            const existingBookWithSameIsbn = await Book.findOne({ isbn });
            if (existingBookWithSameIsbn && existingBookWithSameIsbn._id.toString() !== bookId) {
                // Delete uploaded file if ISBN already exists for another book
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(409).json({ message: 'Book with this ISBN already exists.' });
            }

            await book.save();
            res.json({ message: 'Book updated successfully!' });

        } catch (err) {
            console.error('Error updating book:', err);
            // Delete uploaded file if other server error occurs
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    // @route   DELETE /api/librarian/books/:id
    // @desc    Delete a book
    // @access  Private (Librarian only)
    router.delete('/books/:id', protect, async (req, res) => {
        const bookId = req.params.id;

        try {
            const book = await Book.findById(bookId);

            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }

            // Delete the associated cover image file if it exists
            if (book.cover_image_url && book.cover_image_url.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, '..', book.cover_image_url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await book.deleteOne(); // Use deleteOne() for Mongoose 6+

            res.json({ message: 'Book deleted successfully!' });
        } catch (err) {
            console.error('Error deleting book:', err);
            res.status(500).json({ message: 'Server Error' });
        }
    });

    module.exports = router;
    
