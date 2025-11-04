const express = require('express');
const UploadController = require('../controllers/UploadController');
const { upload, handleMulterError } = require('../lib/upload');

const router = express.Router();

router.post('/upload', upload.single('file'), handleMulterError, UploadController.uploadFile);
router.get('/upload/status/:jobId', UploadController.getJobStatus);

module.exports = router;
