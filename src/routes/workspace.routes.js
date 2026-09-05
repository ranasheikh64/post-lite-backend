const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/workspace.controller');

router.use(auth);

router.post('/', ctrl.createWorkspace);
router.get('/', ctrl.getWorkspaces);
router.delete('/:id', ctrl.deleteWorkspace);

router.post('/:id/members', ctrl.addMember);
router.patch('/:id/members/:userId', ctrl.updateMemberRole);
router.delete('/:id/members/:userId', ctrl.removeMember);

module.exports = router;
