    // backend/server.js
    const express = require('express');
    // const mysql = require('mysql2/promise'); // REMOVED: No longer using MySQL
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');
    const cors = require('cors');

    // Load environment variables from .env file
    dotenv.config();

    const app = express();

    // --- IMPORTANT: Configure CORS to allow requests from your frontend's Render URL ---
    const allowedOrigins = [
        'http://localhost:3000', // For local development
        'https://horizon-library-frontend.onrender.com' // Your deployed frontend URL
    ];

    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true // Allow cookies to be sent (important for authentication)
    }));

    // Middleware for parsing JSON request bodies
    app.use(express.json());

    // Serve static files from the 'uploads' directory (for book covers)
    app.use('/uploads', express.static('uploads'));

    // --- Database Connections ---
    // let mysqlPool; // REMOVED: No longer using MySQL
    let mongoDbConnection; // Declared globally

    async function connectDatabasesAndStartServer() {
        try {
            // REMOVED MySQL Connection block
            // console.log('Connected to MySQL database!');

            // MongoDB Connection
            await mongoose.connect(process.env.MONGO_URI);
            mongoDbConnection = mongoose.connection;
            console.log('Connected to MongoDB database!');

            // --- IMPORTANT: Now that connections are established, make them available and load routes ---
            // Make database connections available to other modules
            module.exports.db = {
                // mysqlPool: mysqlPool, // REMOVED: No longer exposing mysqlPool
                mongoDbConnection: mongoDbConnection
            };

            // --- Import Routes ---
            const librarianRoutes = require('./routes/librarian');
            const studentRoutes = require('./routes/student');
            const publicRoutes = require('./routes/public');

            // --- Use Routes ---
            app.use('/api/librarian', librarianRoutes);
            app.use('/api/student', studentRoutes);
            app.use('/api/books', publicRoutes);

            // Basic route for testing server
            app.get('/', (req, res) => {
                res.send('Horizon Library Backend is running!');
            });

            // Start the server
            const PORT = process.env.PORT || 5000;
            app.listen(PORT, () => console.log(`Server running on port ${PORT}\nAccess it at: http://localhost:${PORT}`));

        } catch (err) {
            console.error('Database connection or server startup error:', err);
            process.exit(1); // Exit process if database connection or server startup fails
        }
    }

    // Call the main function to connect databases and start the server
    connectDatabasesAndStartServer();
