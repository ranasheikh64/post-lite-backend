const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const ctrl = require('../controllers/collection.controller');

router.use(auth);
router.get('/', ctrl.getCollections);
router.post('/', ctrl.createCollection);
router.patch('/:id', ctrl.updateCollection);
router.delete('/:id', ctrl.deleteCollection);

router.post('/import', ctrl.importCollection);

module.exports = router;
