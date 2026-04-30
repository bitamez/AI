const express = require('express');
const { body } = require('express-validator');
const {
    getUserChats,
    createChat,
    getChatMessages,
    sendMessage,
    updateChat,
    deleteChat
} = require('../controllers/chatController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const createChatValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),
    body('context')
        .optional()
        .isIn(['general', 'course-help', 'career-guidance', 'skill-assessment'])
        .withMessage('Invalid chat context')
];

const sendMessageValidation = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 10000 })
        .withMessage('Message content must be between 1 and 10000 characters'),
    body('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array')
];

const updateChatValidation = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters')
];

// All routes require authentication
router.use(protect);

// Routes
router.get('/', getUserChats);
router.post('/', checkSubscription('free'), createChatValidation, createChat);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', checkSubscription('free'), sendMessageValidation, sendMessage);
router.put('/:chatId', updateChatValidation, updateChat);
router.delete('/:chatId', deleteChat);

module.exports = router;