const { validationResult } = require('express-validator');
const { AIChat, AIMessage } = require('../models/Chat');

// @desc    Get user chats
// @route   GET /api/chat
// @access  Private
const getUserChats = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const chats = await AIChat.find({
            user: req.user.id,
            isActive: true
        })
            .sort({ lastMessageAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await AIChat.countDocuments({
            user: req.user.id,
            isActive: true
        });

        // Get last message for each chat
        const chatsWithLastMessage = await Promise.all(
            chats.map(async (chat) => {
                const lastMessage = await AIMessage.findOne({ chat: chat._id })
                    .sort({ createdAt: -1 })
                    .select('content role createdAt')
                    .lean();

                return {
                    ...chat,
                    lastMessage
                };
            })
        );

        res.json({
            success: true,
            data: {
                chats: chatsWithLastMessage,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get user chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new chat
// @route   POST /api/chat
// @access  Private
const createChat = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { title, context = 'general' } = req.body;

        const chat = await AIChat.create({
            user: req.user.id,
            title: title || 'New Chat',
            context
        });

        res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            data: { chat }
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get chat messages
// @route   GET /api/chat/:chatId/messages
// @access  Private
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify chat belongs to user
        const chat = await AIChat.findOne({
            _id: chatId,
            user: req.user.id
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const messages = await AIMessage.find({ chat: chatId })
            .sort({ createdAt: 1 }) // Oldest first for chat display
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await AIMessage.countDocuments({ chat: chatId });

        res.json({
            success: true,
            data: {
                chat,
                messages,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Send message to chat
// @route   POST /api/chat/:chatId/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { chatId } = req.params;
        const { content, attachments = [] } = req.body;

        // Verify chat belongs to user
        const chat = await AIChat.findOne({
            _id: chatId,
            user: req.user.id
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Create user message
        const userMessage = await AIMessage.create({
            chat: chatId,
            role: 'user',
            content,
            attachments
        });

        // Simulate AI response (in real implementation, this would call an AI service)
        const aiResponse = await generateAIResponse(content, chat.context);

        const assistantMessage = await AIMessage.create({
            chat: chatId,
            role: 'assistant',
            content: aiResponse.content,
            metadata: {
                model: 'gpt-3.5-turbo',
                tokens: aiResponse.tokens,
                responseTime: aiResponse.responseTime,
                confidence: aiResponse.confidence
            }
        });

        // Update chat title if it's the first message
        if (chat.title === 'New Chat') {
            const newTitle = content.substring(0, 50) + (content.length > 50 ? '...' : '');
            await AIChat.findByIdAndUpdate(chatId, { title: newTitle });
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: {
                userMessage,
                assistantMessage
            }
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update chat
// @route   PUT /api/chat/:chatId
// @access  Private
const updateChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { title } = req.body;

        const chat = await AIChat.findOneAndUpdate(
            { _id: chatId, user: req.user.id },
            { title },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        res.json({
            success: true,
            message: 'Chat updated successfully',
            data: { chat }
        });
    } catch (error) {
        console.error('Update chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete chat
// @route   DELETE /api/chat/:chatId
// @access  Private
const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await AIChat.findOneAndUpdate(
            { _id: chatId, user: req.user.id },
            { isActive: false },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        res.json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to simulate AI response
const generateAIResponse = async (userMessage, context) => {
    const startTime = Date.now();

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responseTime = Date.now() - startTime;

    // Generate contextual responses based on chat context
    let response = '';

    switch (context) {
        case 'course-help':
            response = `I'd be happy to help you with your course! Based on your question about "${userMessage.substring(0, 50)}...", here are some suggestions:\n\n1. Review the course materials related to this topic\n2. Practice with the provided exercises\n3. Check out the additional resources section\n\nIs there a specific concept you're struggling with?`;
            break;

        case 'career-guidance':
            response = `Great question about your career path! For "${userMessage.substring(0, 50)}...", I recommend:\n\n1. Identifying the key skills needed in your target role\n2. Building a portfolio that showcases these skills\n3. Networking with professionals in the field\n4. Considering relevant certifications\n\nWhat specific career goals are you working towards?`;
            break;

        case 'skill-assessment':
            response = `Let me help you assess your skills! Based on your question about "${userMessage.substring(0, 50)}...", here's what I suggest:\n\n1. Take our skill assessment quiz\n2. Review your learning progress\n3. Identify areas for improvement\n4. Set specific learning goals\n\nWould you like me to recommend some courses to strengthen specific skills?`;
            break;

        default:
            response = `Thank you for your message! I understand you're asking about "${userMessage.substring(0, 50)}..."\n\nI'm here to help with:\n• Course recommendations\n• Learning guidance\n• Skill development\n• Career advice\n\nHow can I assist you with your learning journey today?`;
    }

    return {
        content: response,
        tokens: Math.floor(response.length / 4), // Rough token estimate
        responseTime,
        confidence: 0.85 + Math.random() * 0.15 // Random confidence between 0.85-1.0
    };
};

module.exports = {
    getUserChats,
    createChat,
    getChatMessages,
    sendMessage,
    updateChat,
    deleteChat
};