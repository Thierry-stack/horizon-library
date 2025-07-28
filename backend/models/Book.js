    // backend/models/Book.js
    const mongoose = require('mongoose');

    const BookSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: String,
            required: true,
            trim: true
        },
        isbn: {
            type: String,
            required: true,
            unique: true, // ISBNs should be unique
            trim: true
        },
        published_date: {
            type: Date,
            required: true
        },
        description: {
            type: String,
            trim: true
        },
        cover_image_url: { // Stores the path/URL to the uploaded image
            type: String,
            default: null // Can be null if no image is uploaded
        },
        shelf_number: {
            type: String,
            trim: true
        },
        row_position: {
            type: String,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    });

    const Book = mongoose.model('Book', BookSchema);

    module.exports = Book;
    
