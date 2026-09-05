const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const ctrl = require('../controllers/request.controller');

router.use(auth);
router.get('/collection/:collectionId', ctrl.getRequestsByCollection);
router.post('/', ctrl.createRequest);
router.patch('/reorder', ctrl.reorderRequests);
router.patch('/:id', ctrl.updateRequest);
router.delete('/:id', ctrl.deleteRequest);
router.post('/:id/responses', ctrl.saveResponse);
router.delete('/:id/responses/:responseId', ctrl.deleteResponse);

module.exports = router;
