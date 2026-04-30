const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['student', 'instructor', 'admin'],
        default: 'student'
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    streak: {
        type: Number,
        default: 0,
        min: 0
    },
    preferredLanguage: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de', 'zh', 'ja']
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'pro', 'premium'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled'],
            default: 'active'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ xp: -1 });
userSchema.index({ level: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Update level based on XP
userSchema.methods.updateLevel = function () {
    const newLevel = Math.floor(this.xp / 500) + 1;
    if (newLevel > this.level) {
        this.level = newLevel;
        return true; // Level up occurred
    }
    return false;
};

// Add XP and check for level up
userSchema.methods.addXP = function (points) {
    this.xp += points;
    return this.updateLevel();
};

module.exports = mongoose.model('User', userSchema);