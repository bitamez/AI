const express = require('express');
const {
    getUserSkills,
    getSkillAnalysis,
    getUserAchievements,
    getUserChallenges,
    joinChallenge,
    getLeaderboard,
    getProgressDashboard
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/dashboard', getProgressDashboard);
router.get('/skills', getUserSkills);
router.get('/skill-analysis/:targetRole', getSkillAnalysis);
router.get('/achievements', getUserAchievements);
router.get('/challenges', getUserChallenges);
router.post('/challenges/:challengeId/join', joinChallenge);
router.get('/leaderboard', getLeaderboard);

module.exports = router;