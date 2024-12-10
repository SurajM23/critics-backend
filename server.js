// server.js

const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const userRoutes = require('./routes/user.js');
const path = require('path');
const reviewRoutes = require('./routes/review.js');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Use routes
app.use('/api/users', userRoutes);

app.use('/api/review', reviewRoutes);



// Start the server
const port = process.env.PORT || 8000; 
app.listen(port, () => console.log(`Server running on port ${process.env.PORT}`));
