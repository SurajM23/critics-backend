// controllers/reviewController.js
const User = require('../models/user.model');
const Review = require('../models/review.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

exports.createReview = async (req, res) => {
    const { movieTitle, reviewText, rating, tags } = req.body;
    const userId = req.userId; // Get logged-in user ID from token

    try {
        if (!movieTitle || !reviewText || typeof rating !== 'number') {
            throw new ApiError(400, "All fields (movieTitle, reviewText, rating) are required.");
        }

        if (rating < 1 || rating > 10) {
            throw new ApiError(400, "Rating should be between 1 and 10.");
        }

        const existingReview = await Review.findOne({ author: userId, movieTitle });
        if (existingReview) {
            existingReview.reviewText = reviewText;
            existingReview.rating = rating;
            existingReview.tags = tags || [];  // Update tags
            existingReview.date = Date.now();  // Update date to current time
            await existingReview.save();
            return res.status(200).json(new ApiResponse(200, { review: existingReview }));
        }

        // Fetch the user's details to get the author's name and profile image
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        // Explicitly log user data to confirm it's being fetched correctly
        console.log("User Data:", user);

        // Create new review
        const newReview = new Review({
            movieTitle,
            reviewText,
            rating,
            author: userId,
            authorName: user.username, // Ensure authorName is set here
            profileImage: user.profileImageUrl || "",  // Default to empty string if no profileImageUrl is found
            tags: tags || [],  // Store tags if provided
            likes: [],  // Initialize with an empty array for likes
        });

        // Log review before saving to confirm everything is correct
        console.log("New Review Data:", newReview);

        await newReview.save();

        // Add review reference to the user's reviews array
        user.reviews.push(newReview._id);
        await user.save();

        // Populate the author object as per your Android model requirements
        const reviewResponse = {
            ...newReview.toObject(),
            author: {
                _id: user._id,
                name: user.username,
                email: user.email,
            },
        };

        res.status(201).json(new ApiResponse(201, { review: reviewResponse }));
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            message: error.message || "An unexpected error occurred."
        });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        // Get pagination parameters from the request body
        const page = parseInt(req.body.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.body.limit) || 10;  // Default to 10 reviews per page if not provided

        // Calculate the number of reviews to skip based on the page and limit
        const skip = (page - 1) * limit;

        // Fetch reviews sorted by 'createdAt' in descending order (latest first)
        const reviews = await Review.find()
            .sort({ createdAt: -1 })  // Sort by 'createdAt' in descending order
            .skip(skip)  // Skip reviews for the previous pages
            .limit(limit)  // Limit to the number of reviews per page
            .populate('author', 'username');  // Populate the 'author' field with the 'username'

        // Get total number of reviews for metadata
        const totalReviews = await Review.countDocuments();

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalReviews / limit);

        // Respond with the reviews and pagination metadata
        res.status(200).json({
            status: 200,
            success: true,
            message: 'Success',
            data: {
                reviews,
                totalReviews,
                totalPages,
                currentPage: page,
                reviewsPerPage: limit
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            message: error.message || "An unexpected error occurred."
        });
    }
};

exports.getUserPosts = async (req, res) => {
    
    try {
        // Extract parameters from the request body
        const { userId, page = 1, limit = 10 } = req.body;

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "User ID is required.",
            });
        }

        // Convert userId to ObjectId
        const authorId = new mongoose.Types.ObjectId(userId);

        // Calculate the number of posts to skip based on page and limit
        const skip = (page - 1) * limit;

        // Fetch posts for the given userId with pagination, sorted by creation date
        const posts = await Review.find({ author: authorId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip) // Skip posts for previous pages
            .limit(parseInt(limit)) // Limit the number of posts
            .populate('author', 'username'); // Populate only the username of the author

        // Get the total number of posts for the user
        const totalPosts = await Review.countDocuments({ author: authorId });

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalPosts / limit);

        // Respond with the posts and pagination metadata
        res.status(200).json({
            status: 200,
            success: true,
            message: 'Success',
            data: {
                posts,
                totalPosts,
                totalPages,
                currentPage: parseInt(page),
                postsPerPage: parseInt(limit),
            },
        });
    } catch (error) {
        // Handle errors and respond with appropriate status
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};

exports.getReviewById = async (req, res) => { 
    try {
        const { id } = req.params; // Get review ID from request parameters
        const { userId } = req.query; // Get user ID from query parameters

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid review ID.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid user ID.",
            });
        }

        // Fetch the review by ID and populate the author's profileImageUrl
        const review = await Review.findById(id)
            .populate('author', 'username profileImageUrl'); // Includes profileImageUrl for the author

        if (!review) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Review not found.",
            });
        }

        // Check if the user has liked the review
        const isLiked = review.likes.includes(userId);

        // Respond with the review details, including isLiked
        res.status(200).json({
            status: 200,
            success: true,
            message: 'Success',
            data: {
                ...review.toObject(),
                isLiked,
            },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};

exports.toggleLike = async (req, res) => {
    const { reviewId, userId } = req.body;

    try {
        if (!reviewId || !userId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Review ID and User ID are required.",
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Review not found.",
            });
        }

        const userIndex = review.likes.indexOf(userId);
        let liked = false;

        if (userIndex > -1) {
            review.likes.splice(userIndex, 1);
        } else {
            review.likes.push(userId);
            liked = true;
        }

        // Update only likes field to avoid full document validation
        await Review.updateOne({ _id: reviewId }, { likes: review.likes });

        res.status(200).json({
            status: 200,
            success: true,
            message: liked ? "Liked successfully." : "Like removed successfully.",
            data: {
                reviewId: review._id,
                totalLikes: review.likes.length,
                liked,
            },
        });
    } catch (error) {
        console.error("Error in toggleLike:", error);
        res.status(500).json({
            status: 500,
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};

exports.updateReview = async (req, res) => {
    const { id } = req.params; // Review ID from URL
    const { movieTitle, reviewText, rating, tags } = req.body; // Updated data
    const userId = req.userId; // User ID from token

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid review ID.",
            });
        }

        if (typeof rating !== 'undefined' && (rating < 1 || rating > 10)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Rating should be between 1 and 10.",
            });
        }

        const review = await Review.findOne({ _id: id, author: userId });
        if (!review) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Review not found or you are not authorized to edit this review.",
            });
        }

        if (movieTitle) review.movieTitle = movieTitle; 
        if (reviewText) review.reviewText = reviewText;
        if (rating) review.rating = rating;
        if (tags) review.tags = tags;

        await review.save();

        res.status(200).json({
            status: 200,
            success: true,
            message: "Review updated successfully.",
            data: review,
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};

exports.deleteReview = async (req, res) => {
    const { id } = req.params; 
    const userId = req.userId; 

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "Invalid review ID.",
            });
        }

        const review = await Review.findOneAndDelete({ _id: id, author: userId });
        if (!review) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Review not found or you are not authorized to delete this review.",
            });
        }

        await User.findByIdAndUpdate(userId, {
            $pull: { reviews: id },
        });

        res.status(200).json({
            status: 200,
            success: true,
            message: "Review deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};



















