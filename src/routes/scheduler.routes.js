const express = require('express');
const SchedulerController = require('../controllers/SchedulerController');

const router = express.Router();

router.post('/schedule/message', SchedulerController.scheduleMessage);
router.get('/schedule/messages', SchedulerController.getScheduledMessages);
router.delete('/schedule/message/:jobId', SchedulerController.cancelMessage);
router.get('/schedule/message/:jobId/status', SchedulerController.getMessageStatus);

module.exports = router;
