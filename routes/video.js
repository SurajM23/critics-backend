// routes/video.js
const express = require('express');
const upload = require('../middleware/upload'); // Import the upload middleware
const { uploadVideo, getRandomVideos, getVideoById} = require('../controllers/videoController'); // Import your video controller
const authenticateToken = require('../middleware/authMiddleware.js'); // Ensure user is authenticated
const router = express.Router();

// Route to upload a video with a thumbnail
router.post('/upload', authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), uploadVideo);

router.get('/random', authenticateToken, getRandomVideos);

router.get('/:videoId', authenticateToken, getVideoById); // Video ID will be in the URL

module.exports = router;
