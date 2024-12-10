const Video = require('../models/video.model'); // Import your Video model
const User = require('../models/user.model');

exports.uploadVideo = async (req, res) => {
    const { title, tags } = req.body; // Assuming title and tags are sent in the body

    console.log('Request body:', req.body);
    console.log('User ID:', req.userId);

    try {
        // Access Cloudinary URLs for the uploaded video and thumbnail files
        const videoFile = req.files['video'][0]; // Access the uploaded video file from Cloudinary
        const thumbnailFile = req.files['thumbnail'][0]; // Access the uploaded thumbnail file from Cloudinary

        console.log('Video file:', videoFile);
        console.log('Thumbnail file:', thumbnailFile);

        // Use Cloudinary's generated URLs (path property)
        const videoUrl = videoFile.path; // Cloudinary URL for the video
        const thumbnailUrl = thumbnailFile.path; // Cloudinary URL for the thumbnail

        console.log('Video URL:', videoUrl);
        console.log('Thumbnail URL:', thumbnailUrl);

        // Create new video document
        const newVideo = new Video({
            title,
            uploader: req.userId, // User ID from token
            uploaderUsername: req.body.uploaderUsername, // Can be fetched from user data
            videoUrl, // Cloudinary URL
            thumbnailUrl, // Cloudinary URL
            tags: tags ? tags.split(',') : [], // Split tags if provided
        });

        console.log('New video document:', newVideo);

        // Save the video to MongoDB
        const savedVideo = await newVideo.save();
        console.log('Saved video:', savedVideo);

        // Update the user's video array with the new video's ID
        await User.findByIdAndUpdate(req.userId, {
            $push: { videos: savedVideo._id }
        });
        console.log('User videos updated with new video ID:', savedVideo._id);

        // Return success response with Cloudinary URLs
        res.status(201).json({
            status: 201,
            message: 'Video uploaded successfully',
            video: savedVideo
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ status: 500, message: error.message });
    }
};



exports.getRandomVideos = async (req, res) => {
    try {
        // Use aggregation to get 10 random videos
        const videos = await Video.aggregate([{ $sample: { size: 10 } }]);

        // Check if any videos were found
        if (!videos.length) {
            return res.status(404).json({
                status: 404,
                message: 'No videos found'
            });
        }

        // Respond with the random videos
        res.status(200).json({
            status: 200,
            data: videos,
            message: 'Random videos fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message
        });
    }
};

exports.getVideoById = async (req, res) => {
    try {
        // Find the video by its ID from the request parameters
        const video = await Video.findById(req.params.videoId);

        // Check if the video exists
        if (!video) {
            return res.status(404).json({
                status: 404,
                message: 'Video not found'
            });
        }

        // Respond with the video data
        res.status(200).json({
            status: 200,
            data: { video },
            message: 'Success'
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: error.message
        });
    }
};


