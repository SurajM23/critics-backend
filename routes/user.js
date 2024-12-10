const express = require('express');
const {getAllUsers, registerUser, loginUser, getUserById,getUserFeed,  toggleConnection, updateProfileImage, updateUserDetails  } = require('../controllers/userController.js'); // Ensure this path is correct
const router = express.Router();
const upload = require('../middleware/upload.js');

const authenticateToken = require('../middleware/authMiddleware');
router.get('/user_list', getAllUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', authenticateToken, getUserById);
router.get('/:id/feed', authenticateToken, getUserFeed);
router.post('/toggleconnection',authenticateToken, toggleConnection);
router.put('/updateprofileimage', authenticateToken , upload,updateProfileImage);
router.put('/updateuserdata', authenticateToken, updateUserDetails);

module.exports = router;
