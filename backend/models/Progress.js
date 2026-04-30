const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    skillName: {
        type: String,
        required: [true, 'Skill name is required'],
        trim: true
    },
    level: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    xpEarned: {
        type: Number,
        default: 0,
        min: 0
    },
    coursesCompleted: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        completedAt: Date,
        xpGained: Number
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure unique skill per user
userSkillSchema.index({ user: 1, skillName: 1 }, { unique: true });
userSkillSchema.index({ user: 1 });
userSkillSchema.index({ skillName: 1 });

// Update skill level based on XP
userSkillSchema.methods.updateLevel = function () {
    // Level calculation: every 100 XP = 1 level, max level 100
    const newLevel = Math.min(Math.floor(this.xpEarned / 100), 100);
    this.level = newLevel;
    this.lastUpdated = new Date();
};

// Add XP to skill
userSkillSchema.methods.addXP = function (xp, courseId = null) {
    this.xpEarned += xp;

    if (courseId) {
        this.coursesCompleted.push({
            course: courseId,
            completedAt: new Date(),
            xpGained: xp
        });
    }

    this.updateLevel();
};

const UserSkill = mongoose.model('UserSkill', userSkillSchema);

// Skill Gap Analysis Schema
const skillAnalysisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    targetRole: {
        type: String,
        required: [true, 'Target role is required'],
        trim: true
    },
    skillGaps: [{
        skillName: {
            type: String,
            required: true
        },
        requiredLevel: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        currentLevel: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        gap: {
            type: Number,
            default: 0
        },
        recommendedCourses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }]
    }],
    overallScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    recommendations: [{
        type: String
    }]
}, {
    timestamps: true
});

skillAnalysisSchema.index({ user: 1 });
skillAnalysisSchema.index({ targetRole: 1 });

// Calculate overall readiness score
skillAnalysisSchema.methods.calculateOverallScore = function () {
    if (this.skillGaps.length === 0) {
        this.overallScore = 0;
        return;
    }

    const totalScore = this.skillGaps.reduce((sum, gap) => {
        const skillScore = Math.min((gap.currentLevel / gap.requiredLevel) * 100, 100);
        return sum + skillScore;
    }, 0);

    this.overallScore = Math.round(totalScore / this.skillGaps.length);
};

const SkillAnalysis = mongoose.model('SkillAnalysis', skillAnalysisSchema);

module.exports = {
    UserSkill,
    SkillAnalysis
};