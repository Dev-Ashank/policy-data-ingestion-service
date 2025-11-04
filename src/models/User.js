const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', ''],
        required: false
    }
}, {
    timestamps: true
});

// Indexes for faster lookups (email already indexed via unique: true)
userSchema.index({ name: 1 });

module.exports = mongoose.model('User', userSchema);
