const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    accountName: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Index for faster lookups
accountSchema.index({ accountName: 1 });

module.exports = mongoose.model('Account', accountSchema);
