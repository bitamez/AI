const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lesson title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course reference is required']
    },
    videoUrl: {
        type: String,
        required: [true, 'Video URL is required']
    },
    duration: {
        type: Number, // in seconds
        required: [true, 'Duration is required'],
        min: 1
    },
    lessonOrder: {
        type: Number,
        required: [true, 'Lesson order is required'],
        min: 1
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    transcript: {
        type: String
    },
    resources: [{
        title: String,
        url: String,
        type: {
            type: String,
            enum: ['pdf', 'link', 'code', 'other']
        }
    }],
    quiz: {
        questions: [{
            question: String,
            options: [String],
            correctAnswer: Number,
            explanation: String
        }],
        passingScore: {
            type: Number,
            default: 70,
            min: 0,
            max: 100
        }
    },
    isPreview: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
lessonSchema.index({ course: 1, lessonOrder: 1 });
lessonSchema.index({ course: 1 });

// Ensure unique lesson order within a course
lessonSchema.index({ course: 1, lessonOrder: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);