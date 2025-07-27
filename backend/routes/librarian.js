    // backend/routes/librarian.js
    const express = require('express');
    const multer = require('multer');
    const router = express.Router();
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { db } = require('../server'); // Import the database connection container
    const { auth, authorize } = require('../middleware/auth'); // Import auth middleware

    // Multer storage configuration
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/'); // Files will be stored in the 'uploads/' directory (relative to backend root)
        },
        filename: function (req, file, cb) {
            // Create a unique filename: fieldname-timestamp.ext
            cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop());
        }
    });

    const upload = multer({ storage: storage });

    // @route   POST /api/librarian/login
    // @desc    Authenticate librarian & get token
    // @access  Public (for login process itself)
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            // Check if librarian exists
            const [rows] = await db.mysqlPool.execute('SELECT id, username, password FROM librarians WHERE username = ?', [username]);
            const librarian = rows[0];

            if (!librarian) {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }

            // Compare provided password with hashed password in DB
            const isMatch = await bcrypt.compare(password, librarian.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }

            // Create JWT Payload
            const payload = {
                user: {
                    id: librarian.id,
                    role: 'librarian'
                }
            };

            // Sign the token
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, role: 'librarian' });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // @route   POST /api/librarian/books
    // @desc    Add a new book (Protected - Librarian only)
    // @access  Private (Librarian)
    router.post('/books', auth, authorize(['librarian']), upload.single('coverImage'), async (req, res) => {
        const { title, author, isbn, published_date, description, shelf_number, row_position } = req.body;
        const cover_image_url = req.file ? `/uploads/${req.file.filename}` : null; // Path to the uploaded file

        try {
            const query = `
                INSERT INTO books 
                (title, author, isbn, published_date, description, cover_image_url, shelf_number, row_position) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                title, 
                author, 
                isbn, 
                published_date, 
                description, 
                cover_image_url, 
                shelf_number || null,     
                row_position || null      
            ];

            const [result] = await db.mysqlPool.execute(query, values); 
            
            res.status(201).json({ message: 'Book added successfully', bookId: result.insertId });
        } catch (err) {
            console.error(err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'A book with this ISBN already exists.' });
            }
            res.status(500).send('Server Error');
        }
    });

    // @route   PUT /api/librarian/books/:id
    // @desc    Update book details (Protected - Librarian only)
    // @access  Private (Librarian)
    router.put('/books/:id', auth, authorize(['librarian']), upload.single('coverImage'), async (req, res) => {
        const { title, author, isbn, published_date, description, shelf_number, row_position } = req.body;
        const { id } = req.params;

        let finalCoverImageUrl = null;

        try {
            if (req.file) {
                finalCoverImageUrl = `/uploads/${req.file.filename}`;
            } else {
                const [bookRows] = await db.mysqlPool.execute('SELECT cover_image_url FROM books WHERE id = ?', [id]);
                if (bookRows.length > 0) {
                    finalCoverImageUrl = bookRows[0].cover_image_url;
                }
                // If the frontend explicitly sends a blank string for cover_image_url
                // and no file was uploaded, it means the user wants to clear the image.
                if (req.body.cover_image_url === '') {
                    finalCoverImageUrl = null;
                }
            }

            const query = `
                UPDATE books 
                SET 
                    title = ?, 
                    author = ?, 
                    isbn = ?, 
                    published_date = ?, 
                    description = ?, 
                    cover_image_url = ?, 
                    shelf_number = ?, 
                    row_position = ? 
                WHERE id = ?
            `;
            const values = [
                title, 
                author, 
                isbn, 
                published_date, 
                description, 
                finalCoverImageUrl, 
                shelf_number || null, 
                row_position || null, 
                id
            ];

            const [result] = await db.mysqlPool.execute(query, values); 
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Book not found' });
            }
            res.json({ message: 'Book updated successfully' });
        } catch (err) {
            console.error(err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'A book with this ISBN already exists.' });
            }
            res.status(500).send('Server Error');
        }
    });

    // @route   DELETE /api/librarian/books/:id
    // @desc    Delete a book (Protected - Librarian only)
    // @access  Private (Librarian)
    router.delete('/books/:id', auth, authorize(['librarian']), async (req, res) => {
        const { id } = req.params;
        try {
            const [result] = await db.mysqlPool.execute('DELETE FROM books WHERE id = ?', [id]); 
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Book not found' });
            }
            res.json({ message: 'Book deleted successfully' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    module.exports = router;
    