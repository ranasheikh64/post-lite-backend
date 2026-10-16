const router = require('express').Router();
const ctrl = require('../controllers/update.controller');

router.get('/latest', ctrl.getLatestUpdate);
router.post('/broadcast', ctrl.broadcastReleaseEmail);

module.exports = router;
