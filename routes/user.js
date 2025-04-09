const express = require('express');
const {
  getAllUsers,
  registerUser,
  loginUser,
  getUserById,
  getUserFeed,
  toggleConnection,
  updateProfileImage,
  updateUserDetails,
  deleteUserAndReviews,
  deleteUserByUsername,
} = require('../controllers/userController.js'); 
const router = express.Router();
const upload = require('../middleware/upload.js');
const authenticateToken = require('../middleware/authMiddleware');

// Route to get all users
router.get('/user_list', getAllUsers);

// Route to register a new user
router.post('/register', registerUser);

// Route to log in a user
router.post('/login', loginUser);

// Route to get a user by ID (requires authentication)
router.get('/:id', authenticateToken, getUserById);

// Route to get a user's feed (requires authentication)
router.get('/:id/feed', authenticateToken, getUserFeed);

// Route to toggle a connection between users (requires authentication)
router.post('/toggleconnection', authenticateToken, toggleConnection);

// Route to update a user's profile image (requires authentication)
router.put('/updateprofileimage', authenticateToken, upload, updateProfileImage);

// Route to update user details (requires authentication)
router.put('/updateuserdata', authenticateToken, updateUserDetails);

// Route to delete a user and their reviews (requires authentication)
router.delete('/deleteUserAndReviews', authenticateToken, deleteUserAndReviews);

// Route to delete a user by username
router.delete('/:username', deleteUserByUsername);

module.exports = router;
