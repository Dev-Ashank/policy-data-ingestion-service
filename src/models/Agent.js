const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Index for faster lookups
agentSchema.index({ name: 1 });

module.exports = mongoose.model('Agent', agentSchema);
