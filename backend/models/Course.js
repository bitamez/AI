const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Course category is required'],
        enum: ['programming', 'data-science', 'ai-ml', 'web-development', 'mobile-development', 'cybersecurity', 'cloud-computing', 'other']
    },
    level: {
        type: String,
        required: [true, 'Course level is required'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Instructor is required']
    },
    thumbnail: {
        type: String,
        default: null
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    totalStudents: {
        type: Number,
        default: 0,
        min: 0
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    requirements: [{
        type: String,
        trim: true
    }],
    learningOutcomes: [{
        type: String,
        trim: true
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date
}, {
    timestamps: true
});

// Indexes for better query performance
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ totalStudents: -1 });
courseSchema.index({ price: 1 });
courseSchema.index({ title: 'text', description: 'text' });

// Virtual for lessons
courseSchema.virtual('lessons', {
    ref: 'Lesson',
    localField: '_id',
    foreignField: 'course'
});

// Update rating when new review is added
courseSchema.methods.updateRating = async function (newRating) {
    const totalRating = (this.rating.average * this.rating.count) + newRating;
    this.rating.count += 1;
    this.rating.average = totalRating / this.rating.count;
    await this.save();
};

module.exports = mongoose.model('Course', courseSchema);