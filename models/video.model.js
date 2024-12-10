const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaderUsername: { type: String, required: true },
    videoUrl: { type: String, required: true }, // URL to the video
    thumbnailUrl: { type: String, required: true }, // URL to the thumbnail
    tags: [String],
    likes: { type: Number, default: 0 },
    comments: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        comment: String,
        commentDate: { type: Date, default: Date.now },
    }],
    views: { type: Number, default: 0 },
    uploadDate: { type: Date, default: Date.now },
});

// Create a model from the schema
const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
