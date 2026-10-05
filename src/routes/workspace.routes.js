const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/workspace.controller');

router.use(auth);

router.post('/', ctrl.createWorkspace);
router.get('/', ctrl.getWorkspaces);
router.delete('/:id', ctrl.deleteWorkspace);

router.post('/:id/members', ctrl.addMember);
router.post('/:id/invite', ctrl.inviteMember);
router.post('/invite/:token/accept', ctrl.acceptInvite);
router.patch('/:id/members/:userId', ctrl.updateMemberRole);
router.delete('/:id/members/:userId', ctrl.removeMember);

router.get('/:id/search', ctrl.searchWorkspace);

module.exports = router;
