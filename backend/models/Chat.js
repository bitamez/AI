const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    title: {
        type: String,
        default: 'New Chat',
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    context: {
        type: String,
        enum: ['general', 'course-help', 'career-guidance', 'skill-assessment'],
        default: 'general'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

aiChatSchema.index({ user: 1, createdAt: -1 });
aiChatSchema.index({ user: 1, isActive: 1 });

const aiMessageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AIChat',
        required: [true, 'Chat reference is required']
    },
    role: {
        type: String,
        required: [true, 'Message role is required'],
        enum: ['user', 'assistant']
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        maxlength: [10000, 'Message content cannot exceed 10000 characters']
    },
    metadata: {
        tokens: Number,
        model: String,
        responseTime: Number, // in milliseconds
        confidence: Number
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'file', 'code']
        },
        url: String,
        filename: String,
        size: Number
    }]
}, {
    timestamps: true
});

aiMessageSchema.index({ chat: 1, createdAt: 1 });

// Update chat's lastMessageAt when new message is added
aiMessageSchema.pre('save', async function (next) {
    if (this.isNew) {
        await mongoose.model('AIChat').findByIdAndUpdate(
            this.chat,
            { lastMessageAt: new Date() }
        );
    }
    next();
});

const AIChat = mongoose.model('AIChat', aiChatSchema);
const AIMessage = mongoose.model('AIMessage', aiMessageSchema);

module.exports = {
    AIChat,
    AIMessage
};