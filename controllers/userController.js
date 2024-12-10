// controllers/userController.js
const User = require('../models/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError.js');
const ApiResponse = require('../utils/ApiResponse.js')
const Review = require('../models/review.model.js'); 
const upload = require('../config/cloudinary.js');
const cloudinary = require('cloudinary').v2;

exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all users, selecting 'username', 'profileImageUrl', and '_id'
        const users = await User.find().select('username profileImageUrl _id');  // Include _id

        // Example transformation: Add absolute URL for profileImageUrl if necessary
        const transformedUsers = users.map(user => ({
            id: user._id,  // Include the user ID
            username: user.username,
            profileImageUrl: user.profileImageUrl
                ? `${process.env.BASE_URL}/${user.profileImageUrl}` // Append base URL if the image path is relative
                : null, // Handle cases where profileImageUrl is missing
        }));

        // Send the list of users as response
        res.status(200).json(new ApiResponse(200, transformedUsers));
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'An error occurred while fetching users.',
        });
    }
};

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists by email
        let existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            throw new ApiError(400, "Email already exists");
        }

        // Check if user already exists by username
        let existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            throw new ApiError(400, "Username already exists");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            videos: [],
            myConnections: [],
            connectedTo: []
        });

        // Save user in DB
        await newUser.save();

        // Create and return JWT token
        const payload = { userId: newUser._id }; // Use the MongoDB generated _id
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Include userId in the response if needed
        res.status(200).json(new ApiResponse(200, { token, userId: newUser._id , username: newUser.username}));
        
    } catch (error) {
        // Handle error response
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            message: error.message || "Server error"
        });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists by email
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(401, "Invalid email id");
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new ApiError(401, "Wrong password");
        }

        // Create and return JWT token
        const payload = { userId: user._id }; // Use _id for JWT payload
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

          // Use ApiResponse class for the response
          res.status(200).json(new ApiResponse(200, { token,
            userId: user._id, // Include userId in the response
            username: user.username // Optional: Include username or other details
     }));
    } catch (error) {
        // Handle error response
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            message: error.message || "Server error"
        });
    }
};
 
exports.getUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        // Find the user by ID and select the fields to include
        const user = await User.findById(userId).select(
            'username email profileImageUrl videos myConnections connectedTo date reviews description'
        );

        // Check if user exists
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Return the user data
        res.status(200).json(new ApiResponse(200, { user }));
    } catch (error) {
        // Handle errors
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            message: error.message || "Server error"
        });
    }
};

exports.getUserFeed = async (req, res) => {
    const { id } = req.params; // User ID from params
    const { page = 1, limit = 20 } = req.query; // Pagination: default to page 1 and 20 reviews per page

    try {
        // Fetch the user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: 'User not found'
            });
        }

        // Get the IDs of the user's connections
        const connectionIds = [...user.myConnections, ...user.connectedTo];

        // Fetch reviews (posts) from the user's connections and populate author details
        const reviews = await Review.find({ author: { $in: connectionIds } })
            .populate('author', 'username profileImageUrl') // Include profileImageUrl
            .sort({ createdAt: -1 }) // Sort by most recent
            .skip((page - 1) * parseInt(limit)) // Skip previous pages' reviews
            .limit(parseInt(limit)); // Limit the number of reviews returned

        // Get total number of reviews
        const totalReviews = await Review.countDocuments({ author: { $in: connectionIds } });

        // Calculate total pages
        const totalPages = Math.ceil(totalReviews / limit);

        // Respond with reviews and pagination metadata in the same format as getAllReviews
        res.status(200).json({
            status: 200,
            success: true,
            message: 'Success',
            data: {
                reviews,
                totalReviews,
                totalPages,
                currentPage: parseInt(page),
                reviewsPerPage: parseInt(limit),
            },
        });
    } catch (error) {
        console.error(error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            message: error.message || 'Server error',
        });
    }
};


exports.toggleConnection = async (req, res) => {
    const { connectingId } = req.body; // ID of the user to connect/disconnect with
    const userId = req.userId; // Authenticated user's ID from token

    try {
        // Validate inputs
        if (!connectingId) {
            return res.status(400).json({
                status: 400,
                message: 'Connecting ID is required.',
                success: false,
            });
        }

        // Fetch the current user and the target user
        const currentUser = await User.findById(userId); // Current user (A)
        const otherUser = await User.findById(connectingId); // Target user (B)

        // Ensure both users exist
        if (!currentUser) {
            return res.status(404).json({
                status: 404,
                message: 'Authenticated user not found.',
                success: false,
            });
        }
        if (!otherUser) {
            return res.status(404).json({
                status: 404,
                message: 'Target user not found.',
                success: false,
            });
        }

        // Check if the users are already connected
        const isConnected = currentUser.connectedTo.includes(connectingId);

        if (isConnected) {
            // Disconnect logic: Remove `connectingId` from `currentUser.connectedTo` and `userId` from `otherUser.myConnections`
            currentUser.connectedTo = currentUser.connectedTo.filter(id => id.toString() !== connectingId);
            otherUser.myConnections = otherUser.myConnections.filter(id => id.toString() !== userId);

            // Save changes to the database
            await currentUser.save();
            await otherUser.save();

            return res.status(200).json({
                status: 200,
                message: 'Disconnected successfully.',
                data: {
                    connected: false,
                    connectingId,
                },
                success: true,
            });
        } else {
            // Connect logic (unchanged): Add `connectingId` to `currentUser.connectedTo` and `userId` to `otherUser.myConnections`
            currentUser.connectedTo.push(connectingId);
            otherUser.myConnections.push(userId);

            // Save changes to the database
            await currentUser.save();
            await otherUser.save();

            return res.status(200).json({
                status: 200,
                message: 'Connected successfully.',
                data: {
                    connected: true,
                    connectingId,
                },
                success: true,
            });
        }
    } catch (error) {
        // Handle unexpected errors
        console.error('Error in toggleConnection:', error);

        return res.status(500).json({
            status: 500,
            message: 'An unexpected error occurred.',
            success: false,
            error: error.message,
        });
    }
};


exports.updateProfileImage = async (req, res) => {
    const userId = req.userId;  // Get user ID from token (ensure you're using a middleware to validate JWT)
    const file = req.file;  // The image file uploaded via the form

    try {
        if (!file) {
            return res.status(400).json({
                status: 400,
                message: 'No file uploaded',
                success: false,
            });
        }

        // Upload the image to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'user_profiles', // Optional: Folder to store images
            public_id: `profile_${userId}`, // Optional: Set a unique public_id for the image
            overwrite: true, // Optional: Overwrite the old image if it exists
        });

        // Get the image URL returned by Cloudinary
        const imageUrl = result.secure_url;

        // Find the user and update their profile image URL
        const user = await User.findByIdAndUpdate(
            userId, 
            { profileImageUrl: imageUrl }, 
            { new: true }  // Return the updated user data
        );

        // Return the updated user data
        res.status(200).json({
            status: 200,
            message: 'Profile image updated successfully',
            success: true,
            data: {
                username: user.username,
                profileImageUrl: user.profileImageUrl,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: 'An error occurred while updating the profile image',
            success: false,
        });
    }
};


exports.updateUserDetails = async (req, res) => {
    const userId = req.userId; // Ensure you're using middleware to extract userId from the token
    const { username, email, description } = req.body; // Extract fields from request body

    try {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Check if the new email is already in use by another user
        if (email && email !== user.email) {
            const existingUserByEmail = await User.findOne({ email });
            if (existingUserByEmail) {
                throw new ApiError(400, "Email is already taken by another user");
            }
        }

        // Check if the new username is already in use by another user
        if (username && username !== user.username) {
            const existingUserByUsername = await User.findOne({ username });
            if (existingUserByUsername) {
                throw new ApiError(400, "Username is already taken by another user");
            }
        }

        // Update fields if provided
        if (username) user.username = username;
        if (email) user.email = email;
        if (description) user.description = description;

        // Save the updated user details
        await user.save();

        // Respond with the updated user details
        res.status(200).json({
            status: 200,
            message: "User details updated successfully",
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                description: user.description,
                profileImageUrl: user.profileImageUrl, // Include this in case the client needs it
            },
        });
    } catch (error) {
        // Handle errors
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: statusCode,
            message: error.message || "An error occurred while updating user details",
            success: false,
        });
    }
};
