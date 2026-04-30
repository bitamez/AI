const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Challenge title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Challenge description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty level is required'],
        enum: ['easy', 'medium', 'hard']
    },
    rewardXP: {
        type: Number,
        required: [true, 'Reward XP is required'],
        min: 1
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['daily', 'weekly', 'monthly', 'special-event']
    },
    type: {
        type: String,
        required: [true, 'Challenge type is required'],
        enum: ['course-completion', 'lesson-streak', 'quiz-score', 'time-spent', 'skill-level']
    },
    criteria: {
        target: {
            type: Number,
            required: true
        },
        metric: {
            type: String,
            required: true,
            enum: ['courses', 'lessons', 'days', 'hours', 'score', 'level']
        },
        timeframe: {
            type: Number, // in days
            default: 1
        }
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    participantCount: {
        type: Number,
        default: 0
    },
    completionCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

challengeSchema.index({ category: 1, isActive: 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });
challengeSchema.index({ difficulty: 1 });

const userChallengeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: [true, 'Challenge reference is required']
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed'],
        default: 'pending'
    },
    progress: {
        current: {
            type: Number,
            default: 0
        },
        target: {
            type: Number,
            required: true
        },
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    startedAt: Date,
    completedAt: Date,
    xpEarned: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index to ensure unique challenge participation per user
userChallengeSchema.index({ user: 1, challenge: 1 }, { unique: true });
userChallengeSchema.index({ user: 1, status: 1 });

// Update progress percentage
userChallengeSchema.methods.updateProgress = function (newProgress) {
    this.progress.current = Math.min(newProgress, this.progress.target);
    this.progress.percentage = Math.round((this.progress.current / this.progress.target) * 100);

    if (this.progress.percentage >= 100 && this.status !== 'completed') {
        this.status = 'completed';
        this.completedAt = new Date();
    } else if (this.progress.current > 0 && this.status === 'pending') {
        this.status = 'in-progress';
        this.startedAt = new Date();
    }
};

const Challenge = mongoose.model('Challenge', challengeSchema);
const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);

module.exports = {
    Challenge,
    UserChallenge
};