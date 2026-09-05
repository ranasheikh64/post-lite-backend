const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/sync.controller');

router.use(auth);
router.post('/', ctrl.sync);

module.exports = router;
