// models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profileImageUrl: {
        type: String,
    },
    description: {
        type: String,
        default: 'Hello there' // Default value
    },
    date: {
        type: Date,
        default: Date.now
    },
    reviews: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Review',
        default: []
    },
    myConnections: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    },
    connectedTo: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    }
});

module.exports = mongoose.model('User', UserSchema);
