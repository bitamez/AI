const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course reference is required']
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completedLessons: [{
        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        timeSpent: Number, // in seconds
        quizScore: Number
    }],
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    certificateIssued: {
        type: Boolean,
        default: false
    },
    certificateUrl: String,
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    totalTimeSpent: {
        type: Number,
        default: 0 // in seconds
    }
}, {
    timestamps: true
});

// Compound index to ensure unique enrollment per user-course pair
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ user: 1 });
enrollmentSchema.index({ course: 1 });

// Calculate progress based on completed lessons
enrollmentSchema.methods.calculateProgress = async function () {
    const Lesson = mongoose.model('Lesson');
    const totalLessons = await Lesson.countDocuments({ course: this.course });

    if (totalLessons === 0) {
        this.progress = 0;
    } else {
        this.progress = Math.round((this.completedLessons.length / totalLessons) * 100);
    }

    // Mark as completed if 100% progress
    if (this.progress === 100 && !this.completedAt) {
        this.completedAt = new Date();
    }

    return this.progress;
};

// Mark lesson as completed
enrollmentSchema.methods.completeLesson = function (lessonId, timeSpent = 0, quizScore = null) {
    const existingCompletion = this.completedLessons.find(
        cl => cl.lesson.toString() === lessonId.toString()
    );

    if (!existingCompletion) {
        this.completedLessons.push({
            lesson: lessonId,
            completedAt: new Date(),
            timeSpent,
            quizScore
        });
        this.totalTimeSpent += timeSpent;
    }

    return this.calculateProgress();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);