const { UserSkill, SkillAnalysis } = require('../models/Progress');
const { Achievement, UserAchievement } = require('../models/Achievement');
const { Challenge, UserChallenge } = require('../models/Challenge');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// @desc    Get user skills
// @route   GET /api/progress/skills
// @access  Private
const getUserSkills = async (req, res) => {
    try {
        const skills = await UserSkill.find({ user: req.user.id })
            .populate('coursesCompleted.course', 'title thumbnail')
            .sort({ level: -1, xpEarned: -1 })
            .lean();

        res.json({
            success: true,
            data: { skills }
        });
    } catch (error) {
        console.error('Get user skills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get skill analysis
// @route   GET /api/progress/skill-analysis/:targetRole
// @access  Private
const getSkillAnalysis = async (req, res) => {
    try {
        const { targetRole } = req.params;

        let analysis = await SkillAnalysis.findOne({
            user: req.user.id,
            targetRole
        }).populate('skillGaps.recommendedCourses', 'title thumbnail price rating');

        if (!analysis) {
            // Create new analysis based on target role
            const roleSkillRequirements = {
                'data-scientist': [
                    { skillName: 'python', requiredLevel: 80 },
                    { skillName: 'machine-learning', requiredLevel: 75 },
                    { skillName: 'statistics', requiredLevel: 70 },
                    { skillName: 'data-visualization', requiredLevel: 65 }
                ],
                'web-developer': [
                    { skillName: 'javascript', requiredLevel: 85 },
                    { skillName: 'html-css', requiredLevel: 80 },
                    { skillName: 'react', requiredLevel: 75 },
                    { skillName: 'node-js', requiredLevel: 70 }
                ],
                'mobile-developer': [
                    { skillName: 'react-native', requiredLevel: 80 },
                    { skillName: 'flutter', requiredLevel: 75 },
                    { skillName: 'mobile-ui-ux', requiredLevel: 70 },
                    { skillName: 'api-integration', requiredLevel: 65 }
                ]
            };

            const requirements = roleSkillRequirements[targetRole] || [];

            // Get user's current skills
            const userSkills = await UserSkill.find({ user: req.user.id }).lean();

            const skillGaps = requirements.map(req => {
                const userSkill = userSkills.find(us => us.skillName === req.skillName);
                const currentLevel = userSkill ? userSkill.level : 0;
                const gap = Math.max(0, req.requiredLevel - currentLevel);

                return {
                    skillName: req.skillName,
                    requiredLevel: req.requiredLevel,
                    currentLevel,
                    gap,
                    recommendedCourses: [] // Will be populated with course recommendations
                };
            });

            analysis = new SkillAnalysis({
                user: req.user.id,
                targetRole,
                skillGaps
            });

            analysis.calculateOverallScore();
            await analysis.save();
        }

        res.json({
            success: true,
            data: { analysis }
        });
    } catch (error) {
        console.error('Get skill analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user achievements
// @route   GET /api/progress/achievements
// @access  Private
const getUserAchievements = async (req, res) => {
    try {
        const { status = 'all' } = req.query;

        const query = { user: req.user.id };
        if (status === 'unlocked') {
            query.isUnlocked = true;
        } else if (status === 'locked') {
            query.isUnlocked = false;
        }

        const userAchievements = await UserAchievement.find(query)
            .populate('achievement')
            .sort({ earnedAt: -1, 'progress.percentage': -1 })
            .lean();

        // Get total achievement stats
        const totalAchievements = await Achievement.countDocuments({ isActive: true });
        const unlockedCount = await UserAchievement.countDocuments({
            user: req.user.id,
            isUnlocked: true
        });

        res.json({
            success: true,
            data: {
                achievements: userAchievements,
                stats: {
                    total: totalAchievements,
                    unlocked: unlockedCount,
                    locked: totalAchievements - unlockedCount,
                    completionPercentage: Math.round((unlockedCount / totalAchievements) * 100)
                }
            }
        });
    } catch (error) {
        console.error('Get user achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user challenges
// @route   GET /api/progress/challenges
// @access  Private
const getUserChallenges = async (req, res) => {
    try {
        const { status = 'all', category } = req.query;

        const query = { user: req.user.id };
        if (status !== 'all') {
            query.status = status;
        }

        let challengeQuery = { isActive: true };
        if (category) {
            challengeQuery.category = category;
        }

        const userChallenges = await UserChallenge.find(query)
            .populate({
                path: 'challenge',
                match: challengeQuery
            })
            .sort({ createdAt: -1 })
            .lean();

        // Filter out challenges that don't match the category filter
        const filteredChallenges = userChallenges.filter(uc => uc.challenge);

        res.json({
            success: true,
            data: { challenges: filteredChallenges }
        });
    } catch (error) {
        console.error('Get user challenges error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Join challenge
// @route   POST /api/progress/challenges/:challengeId/join
// @access  Private
const joinChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: 'Challenge not found'
            });
        }

        if (!challenge.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Challenge is not active'
            });
        }

        // Check if already joined
        const existingChallenge = await UserChallenge.findOne({
            user: req.user.id,
            challenge: challengeId
        });

        if (existingChallenge) {
            return res.status(400).json({
                success: false,
                message: 'Already joined this challenge'
            });
        }

        const userChallenge = await UserChallenge.create({
            user: req.user.id,
            challenge: challengeId,
            progress: {
                current: 0,
                target: challenge.criteria.target
            }
        });

        // Update challenge participant count
        await Challenge.findByIdAndUpdate(challengeId, {
            $inc: { participantCount: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Successfully joined challenge',
            data: { userChallenge }
        });
    } catch (error) {
        console.error('Join challenge error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get leaderboard
// @route   GET /api/progress/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
    try {
        const { period = 'global', limit = 50 } = req.query;

        let dateFilter = {};
        if (period === 'weekly') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateFilter = { createdAt: { $gte: weekAgo } };
        } else if (period === 'monthly') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateFilter = { createdAt: { $gte: monthAgo } };
        }

        // Get top users by XP
        const topUsers = await User.find(dateFilter)
            .select('fullName avatar xp level streak')
            .sort({ xp: -1, level: -1 })
            .limit(parseInt(limit))
            .lean();

        // Add rank to each user
        const leaderboard = topUsers.map((user, index) => ({
            ...user,
            rank: index + 1
        }));

        // Find current user's position
        let currentUserRank = null;
        if (req.user) {
            const currentUserIndex = leaderboard.findIndex(
                user => user._id.toString() === req.user.id
            );

            if (currentUserIndex !== -1) {
                currentUserRank = currentUserIndex + 1;
            } else {
                // If user not in top list, find their actual rank
                const usersAbove = await User.countDocuments({
                    ...dateFilter,
                    xp: { $gt: req.user.xp }
                });
                currentUserRank = usersAbove + 1;
            }
        }

        res.json({
            success: true,
            data: {
                leaderboard,
                currentUserRank,
                period
            }
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get progress dashboard
// @route   GET /api/progress/dashboard
// @access  Private
const getProgressDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Get enrollment stats
        const totalEnrollments = await Enrollment.countDocuments({ user: req.user.id });
        const completedCourses = await Enrollment.countDocuments({
            user: req.user.id,
            completedAt: { $ne: null }
        });
        const inProgressCourses = await Enrollment.countDocuments({
            user: req.user.id,
            completedAt: null,
            progress: { $gt: 0 }
        });

        // Get recent achievements
        const recentAchievements = await UserAchievement.find({
            user: req.user.id,
            isUnlocked: true
        })
            .populate('achievement')
            .sort({ earnedAt: -1 })
            .limit(5)
            .lean();

        // Get active challenges
        const activeChallenges = await UserChallenge.find({
            user: req.user.id,
            status: { $in: ['pending', 'in-progress'] }
        })
            .populate('challenge')
            .limit(3)
            .lean();

        // Get skill progress
        const topSkills = await UserSkill.find({ user: req.user.id })
            .sort({ level: -1 })
            .limit(5)
            .lean();

        res.json({
            success: true,
            data: {
                user: {
                    xp: user.xp,
                    level: user.level,
                    streak: user.streak
                },
                courseStats: {
                    total: totalEnrollments,
                    completed: completedCourses,
                    inProgress: inProgressCourses,
                    completionRate: totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0
                },
                recentAchievements,
                activeChallenges,
                topSkills
            }
        });
    } catch (error) {
        console.error('Get progress dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getUserSkills,
    getSkillAnalysis,
    getUserAchievements,
    getUserChallenges,
    joinChallenge,
    getLeaderboard,
    getProgressDashboard
};