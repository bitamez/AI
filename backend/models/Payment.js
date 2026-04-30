const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    plan: {
        type: String,
        required: [true, 'Subscription plan is required'],
        enum: ['free', 'pro', 'premium']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD']
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled', 'expired', 'pending'],
        default: 'pending'
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    cancelledAt: Date,
    cancellationReason: String,
    trialEndDate: Date,
    isTrialActive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function () {
    return this.status === 'active' && new Date() <= this.endDate;
};

// Check if trial is active
subscriptionSchema.methods.isTrialActive = function () {
    return this.isTrialActive && this.trialEndDate && new Date() <= this.trialEndDate;
};

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: [true, 'Subscription reference is required']
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD']
    },
    paymentMethod: {
        type: String,
        required: [true, 'Payment method is required'],
        enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer']
    },
    status: {
        type: String,
        required: [true, 'Payment status is required'],
        enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled']
    },
    transactionId: {
        type: String,
        required: [true, 'Transaction ID is required'],
        unique: true
    },
    paymentGateway: {
        type: String,
        enum: ['stripe', 'paypal', 'razorpay', 'square'],
        default: 'stripe'
    },
    gatewayTransactionId: String,
    gatewayResponse: {
        type: mongoose.Schema.Mixed
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    invoice: {
        invoiceNumber: String,
        invoiceUrl: String,
        downloadUrl: String
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        country: String
    }
}, {
    timestamps: true
});

paymentSchema.index({ user: 1 });
paymentSchema.index({ subscription: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paidAt: -1 });

// Mark payment as completed
paymentSchema.methods.markCompleted = function (gatewayTransactionId, gatewayResponse) {
    this.status = 'completed';
    this.paidAt = new Date();
    this.gatewayTransactionId = gatewayTransactionId;
    this.gatewayResponse = gatewayResponse;
};

// Process refund
paymentSchema.methods.processRefund = function (amount, reason) {
    this.status = 'refunded';
    this.refundedAt = new Date();
    this.refundAmount = amount || this.amount;
    this.refundReason = reason;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = {
    Subscription,
    Payment
};