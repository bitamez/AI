const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Achievement title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Achievement description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    icon: {
        type: String,
        required: [true, 'Achievement icon is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['learning', 'social', 'streak', 'milestone', 'special']
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    conditionType: {
        type: String,
        required: [true, 'Condition type is required'],
        enum: [
            'courses_completed',
            'lessons_completed',
            'xp_earned',
            'streak_days',
            'skill_level_reached',
            'challenges_completed',
            'perfect_quiz_scores',
            'time_spent_learning'
        ]
    },
    conditionValue: {
        type: Number,
        required: [true, 'Condition value is required'],
        min: 1
    },
    rewardXP: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    earnedCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ conditionType: 1 });
achievementSchema.index({ rarity: 1 });

const userAchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    achievement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        required: [true, 'Achievement reference is required']
    },
    earnedAt: {
        type: Date,
        default: Date.now
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
    isUnlocked: {
        type: Boolean,
        default: false
    },
    notificationSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to ensure unique achievement per user
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, isUnlocked: 1 });
userAchievementSchema.index({ user: 1, earnedAt: -1 });

// Update progress and check if achievement is unlocked
userAchievementSchema.methods.updateProgress = function (currentValue) {
    this.progress.current = Math.min(currentValue, this.progress.target);
    this.progress.percentage = Math.round((this.progress.current / this.progress.target) * 100);

    if (this.progress.percentage >= 100 && !this.isUnlocked) {
        this.isUnlocked = true;
        this.earnedAt = new Date();
        return true; // Achievement unlocked
    }

    return false;
};

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = {
    Achievement,
    UserAchievement
};