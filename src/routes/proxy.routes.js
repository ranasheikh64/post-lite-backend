const router = require('express').Router();
const multer = require('multer');
const proxyController = require('../controllers/proxy.controller');

const upload = multer();

router.post('/', upload.any(), proxyController.proxyRequest);

module.exports = router;
