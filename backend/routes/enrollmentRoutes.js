const express = require('express');
const { body } = require('express-validator');
const {
    enrollInCourse,
    getUserEnrollments,
    getEnrollmentDetails,
    completeLesson,
    updateLessonProgress
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const completeLessonValidation = [
    body('timeSpent')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Time spent must be a positive integer'),
    body('quizScore')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Quiz score must be between 0 and 100')
];

const updateProgressValidation = [
    body('watchTime')
        .isInt({ min: 0 })
        .withMessage('Watch time must be a positive integer'),
    body('totalDuration')
        .isInt({ min: 1 })
        .withMessage('Total duration must be a positive integer')
];

// All routes require authentication
router.use(protect);

// Routes
router.post('/:courseId', enrollInCourse);
router.get('/', getUserEnrollments);
router.get('/:courseId', getEnrollmentDetails);
router.post('/:courseId/lessons/:lessonId/complete', completeLessonValidation, completeLesson);
router.put('/:courseId/lessons/:lessonId/progress', updateProgressValidation, updateLessonProgress);

module.exports = router;