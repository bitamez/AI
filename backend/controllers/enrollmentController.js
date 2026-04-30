const { validationResult } = require('express-validator');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const { UserSkill } = require('../models/Progress');

// @desc    Enroll in course
// @route   POST /api/enrollments/:courseId
// @access  Private
const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (!course.isPublished) {
            return res.status(400).json({
                success: false,
                message: 'Course is not published'
            });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            user: req.user.id,
            course: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course'
            });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            user: req.user.id,
            course: courseId
        });

        // Update course total students
        await Course.findByIdAndUpdate(courseId, {
            $inc: { totalStudents: 1 }
        });

        const populatedEnrollment = await Enrollment.findById(enrollment._id)
            .populate('course', 'title description thumbnail')
            .lean();

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in course',
            data: { enrollment: populatedEnrollment }
        });
    } catch (error) {
        console.error('Enroll in course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user enrollments
// @route   GET /api/enrollments
// @access  Private
const getUserEnrollments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: req.user.id };

        // Filter by completion status
        if (status === 'completed') {
            query.completedAt = { $ne: null };
        } else if (status === 'in-progress') {
            query.completedAt = null;
            query.progress = { $gt: 0 };
        } else if (status === 'not-started') {
            query.progress = 0;
        }

        const enrollments = await Enrollment.find(query)
            .populate('course', 'title description thumbnail rating totalStudents')
            .sort({ enrolledAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Enrollment.countDocuments(query);

        res.json({
            success: true,
            data: {
                enrollments,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get user enrollments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get enrollment details
// @route   GET /api/enrollments/:courseId
// @access  Private
const getEnrollmentDetails = async (req, res) => {
    try {
        const { courseId } = req.params;

        const enrollment = await Enrollment.findOne({
            user: req.user.id,
            course: courseId
        })
            .populate('course')
            .populate('completedLessons.lesson')
            .lean();

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Get all lessons for progress tracking
        const allLessons = await Lesson.find({ course: courseId })
            .sort({ lessonOrder: 1 })
            .lean();

        // Calculate detailed progress
        const lessonsWithProgress = allLessons.map(lesson => {
            const completed = enrollment.completedLessons.find(
                cl => cl.lesson._id.toString() === lesson._id.toString()
            );

            return {
                ...lesson,
                isCompleted: !!completed,
                completedAt: completed?.completedAt,
                timeSpent: completed?.timeSpent || 0,
                quizScore: completed?.quizScore
            };
        });

        res.json({
            success: true,
            data: {
                enrollment: {
                    ...enrollment,
                    lessonsWithProgress
                }
            }
        });
    } catch (error) {
        console.error('Get enrollment details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Mark lesson as completed
// @route   POST /api/enrollments/:courseId/lessons/:lessonId/complete
// @access  Private
const completeLesson = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const { timeSpent = 0, quizScore } = req.body;

        // Find enrollment
        const enrollment = await Enrollment.findOne({
            user: req.user.id,
            course: courseId
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Verify lesson belongs to course
        const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Mark lesson as completed
        const wasLevelUp = enrollment.completeLesson(lessonId, timeSpent, quizScore);
        await enrollment.save();

        // Award XP to user
        const user = await User.findById(req.user.id);
        const xpGained = 50; // Base XP for completing a lesson
        const leveledUp = user.addXP(xpGained);
        await user.save();

        // Update user skills based on course category
        const course = await Course.findById(courseId);
        if (course.category) {
            let userSkill = await UserSkill.findOne({
                user: req.user.id,
                skillName: course.category
            });

            if (!userSkill) {
                userSkill = new UserSkill({
                    user: req.user.id,
                    skillName: course.category
                });
            }

            userSkill.addXP(25); // Skill XP for lesson completion
            await userSkill.save();
        }

        // Update last accessed
        enrollment.lastAccessedAt = new Date();
        await enrollment.save();

        res.json({
            success: true,
            message: 'Lesson marked as completed',
            data: {
                progress: enrollment.progress,
                xpGained,
                leveledUp,
                newLevel: user.level,
                totalXP: user.xp
            }
        });
    } catch (error) {
        console.error('Complete lesson error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update lesson progress (for video watching)
// @route   PUT /api/enrollments/:courseId/lessons/:lessonId/progress
// @access  Private
const updateLessonProgress = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const { watchTime, totalDuration } = req.body;

        const enrollment = await Enrollment.findOne({
            user: req.user.id,
            course: courseId
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Update last accessed
        enrollment.lastAccessedAt = new Date();
        await enrollment.save();

        // Auto-complete if watched 90% of video
        const watchPercentage = (watchTime / totalDuration) * 100;
        if (watchPercentage >= 90) {
            const existingCompletion = enrollment.completedLessons.find(
                cl => cl.lesson.toString() === lessonId
            );

            if (!existingCompletion) {
                enrollment.completeLesson(lessonId, watchTime);
                await enrollment.save();

                // Award XP
                const user = await User.findById(req.user.id);
                user.addXP(50);
                await user.save();
            }
        }

        res.json({
            success: true,
            message: 'Progress updated',
            data: {
                watchPercentage: Math.round(watchPercentage),
                autoCompleted: watchPercentage >= 90
            }
        });
    } catch (error) {
        console.error('Update lesson progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    enrollInCourse,
    getUserEnrollments,
    getEnrollmentDetails,
    completeLesson,
    updateLessonProgress
};