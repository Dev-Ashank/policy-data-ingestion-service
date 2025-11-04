const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    policyNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    policyMode: {
        type: String,
        required: true,
        trim: true
    },
    producer: {
        type: String,
        required: true,
        trim: true
    },
    premiumAmount: {
        type: Number,
        required: true,
        min: 0
    },
    policyType: {
        type: String,
        required: true,
        trim: true
    },
    csr: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    // References
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: false
    },
    policyCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PolicyCategory',
        required: true
    },
    policyCarrier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PolicyCarrier',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for faster lookups (policyNumber already indexed via unique: true)
policySchema.index({ user: 1 });
policySchema.index({ agent: 1 });
policySchema.index({ startDate: 1, endDate: 1 });

// Validation: endDate must be after startDate
policySchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Policy', policySchema);
