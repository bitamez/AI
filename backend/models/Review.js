const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        trim: true
    },
    pros: [{
        type: String,
        trim: true,
        maxlength: [200, 'Pro point cannot exceed 200 characters']
    }],
    cons: [{
        type: String,
        trim: true,
        maxlength: [200, 'Con point cannot exceed 200 characters']
    }],
    wouldRecommend: {
        type: Boolean,
        default: true
    },
    helpfulVotes: {
        type: Number,
        default: 0,
        min: 0
    },
    reportedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    isModerated: {
        type: Boolean,
        default: false
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    moderationNotes: String,
    editedAt: Date,
    originalRating: Number,
    originalComment: String
}, {
    timestamps: true
});

// Compound index to ensure unique review per user-course pair
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1, rating: -1 });
reviewSchema.index({ course: 1, createdAt: -1 });
reviewSchema.index({ moderationStatus: 1 });

// Update course rating when review is saved
reviewSchema.post('save', async function () {
    const Course = mongoose.model('Course');
    const reviews = await mongoose.model('Review').find({
        course: this.course,
        moderationStatus: 'approved'
    });

    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await Course.findByIdAndUpdate(this.course, {
            'rating.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal
            'rating.count': reviews.length
        });
    }
});

// Update course rating when review is deleted
reviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const Course = mongoose.model('Course');
        const reviews = await mongoose.model('Review').find({
            course: doc.course,
            moderationStatus: 'approved'
        });

        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;

            await Course.findByIdAndUpdate(doc.course, {
                'rating.average': Math.round(averageRating * 10) / 10,
                'rating.count': reviews.length
            });
        } else {
            await Course.findByIdAndUpdate(doc.course, {
                'rating.average': 0,
                'rating.count': 0
            });
        }
    }
});

// Mark review as helpful
reviewSchema.methods.markHelpful = function () {
    this.helpfulVotes += 1;
    return this.save();
};

// Report review
reviewSchema.methods.report = function () {
    this.reportedCount += 1;
    if (this.reportedCount >= 5) {
        this.moderationStatus = 'pending';
    }
    return this.save();
};

// Edit review
reviewSchema.methods.editReview = function (newRating, newComment) {
    this.originalRating = this.originalRating || this.rating;
    this.originalComment = this.originalComment || this.comment;

    this.rating = newRating;
    this.comment = newComment;
    this.editedAt = new Date();
    this.moderationStatus = 'pending'; // Re-moderate edited reviews

    return this.save();
};

module.exports = mongoose.model('Review', reviewSchema);