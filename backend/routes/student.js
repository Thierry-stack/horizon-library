    // backend/routes/student.js
    const express = require('express');
    const router = express.Router();

    // This route will be expanded later for student-specific functionalities.
    router.get('/', (req, res) => {
        res.send('Student API route is working!');
    });

    module.exports = router;
    