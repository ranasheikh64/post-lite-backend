const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

router.get('/me', authMiddleware, ctrl.getMe);
router.delete('/me', authMiddleware, ctrl.deleteAccount);
router.get('/users', authMiddleware, ctrl.searchUsers);

module.exports = router;
