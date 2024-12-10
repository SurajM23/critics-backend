// config/multer.js
const multer = require('multer');

// Set up storage configuration for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Define where to store the uploaded files temporarily
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use timestamp to avoid filename conflicts
    },
});

// File filter (optional): Restrict file types to images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);  // Accept file
    } else {
        cb(new Error('Only image files are allowed'), false);  // Reject non-image files
    }
};

// Create the upload middleware using multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
}).single('profileImage');  // 'profileImage' is the key in the frontend form

module.exports = upload;
