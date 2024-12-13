const express = require('express');
const connectDB = require('./config/db.js');
require('dotenv').config();
const userRoutes = require('./routes/user.js');
const path = require('path');
const reviewRoutes = require('./routes/review.js');

const app = express();
connectDB();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/review', reviewRoutes);

const port = process.env.PORT || 8000; 
app.listen(port, () => console.log(`Server running on port ${process.env.PORT}`));
