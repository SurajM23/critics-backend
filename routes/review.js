// routes/review.js
const express = require('express');
const authenticateToken = require('../middleware/authMiddleware.js'); // Ensure user is authenticated
const { createReview, getAllReviews, getUserPosts, getReviewById, toggleLike } = require('../controllers/reviewController.js'); 

const router = express.Router();

router.post('/add_review', authenticateToken, createReview);

router.post('/get_reviews', getAllReviews);

router.post('/get_user_posts', getUserPosts);

router.get('/reviews/:id', getReviewById);

router.post('/like', toggleLike);

module.exports = router;
