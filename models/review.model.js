const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    movieTitle: {
        type: String,
        required: true
    },
    reviewText: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: {
        type: String,  // Ensure this is a String type and it's required
        required: true
    },
    profileImage: {
        type: String,  // Profile image URL for the author (optional)
    },
    tags: {
        type: [String],
        default: []
    },
    likes: {
        type: [String],
        default: []
    }
}, { timestamps: true });  // Enable timestamps to automatically add createdAt and updatedAt

module.exports = mongoose.model('Review', reviewSchema);
