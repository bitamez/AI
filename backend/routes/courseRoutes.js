const express = require('express');
const { body } = require('express-validator');
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    getInstructorCourses
} = require('../controllers/courseController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const courseValidation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
    body('description')
        .trim()
        .isLength({ min: 20, max: 2000 })
        .withMessage('Description must be between 20 and 2000 characters'),
    body('category')
        .isIn(['programming', 'data-science', 'ai-ml', 'web-development', 'mobile-development', 'cybersecurity', 'cloud-computing', 'other'])
        .withMessage('Invalid category'),
    body('level')
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Level must be beginner, intermediate, or advanced'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('requirements')
        .optional()
        .isArray()
        .withMessage('Requirements must be an array'),
    body('learningOutcomes')
        .optional()
        .isArray()
        .withMessage('Learning outcomes must be an array')
];

const updateCourseValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 20, max: 2000 })
        .withMessage('Description must be between 20 and 2000 characters'),
    body('category')
        .optional()
        .isIn(['programming', 'data-science', 'ai-ml', 'web-development', 'mobile-development', 'cybersecurity', 'cloud-computing', 'other'])
        .withMessage('Invalid category'),
    body('level')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Level must be beginner, intermediate, or advanced'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean')
];

// Public routes
router.get('/', optionalAuth, getCourses);
router.get('/:id', optionalAuth, getCourse);

// Protected routes
router.post('/', protect, authorize('instructor', 'admin'), courseValidation, createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourseValidation, updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

// Instructor routes
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), getInstructorCourses);

module.exports = router;