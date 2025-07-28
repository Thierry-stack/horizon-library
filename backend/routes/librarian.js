// backend/models/Librarian.js
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');

    const LibrarianSchema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        role: { // Added role for clarity, though it's implicitly 'librarian'
            type: String,
            default: 'librarian'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    });

    // Hash the password before saving (pre-save hook)
    LibrarianSchema.pre('save', async function(next) {
        if (!this.isModified('password')) {
            return next();
        }
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    });

    // Method to compare password (for login)
    LibrarianSchema.methods.matchPassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    };

    const Librarian = mongoose.model('Librarian', LibrarianSchema);

    module.exports = Librarian;
    
