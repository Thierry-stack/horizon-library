// backend/server.js
    const express = require('express');
    const mysql = require('mysql2/promise'); // Using promise-based MySQL2
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');
    const cors = require('cors');

    // Load environment variables from .env file
    dotenv.config();

    const app = express();

    // Middleware
    app.use(cors()); // Enable CORS for all routes
    app.use(express.json()); // For parsing application/json

    // Serve static files from the 'uploads' directory
    app.use('/uploads', express.static('uploads')); // This will be used for book covers

    // --- Database Connections ---
    let mysqlPool; // Declared globally
    let mongoDbConnection; // Declared globally

    async function connectDatabasesAndStartServer() {
        try {
            // MySQL Connection
            mysqlPool = await mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            console.log('Connected to MySQL database!');

            // MongoDB Connection
            await mongoose.connect(process.env.MONGO_URI); // Removed deprecated options
            mongoDbConnection = mongoose.connection;
            console.log('Connected to MongoDB database!');

            // --- IMPORTANT: Now that connections are established, make them available and load routes ---
            // Make database connections available to other modules
            module.exports.db = {
                mysqlPool: mysqlPool,
                mongoDbConnection: mongoDbConnection
            };

            // --- Import Routes ---
            // These require statements will now execute AFTER db connections are ready
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
    