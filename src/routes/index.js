const express = require('express');
const uploadRoutes = require('./upload.routes');
const policyRoutes = require('./policy.routes');
const schedulerRoutes = require('./scheduler.routes');

const router = express.Router();

router.use('/', uploadRoutes);
router.use('/', policyRoutes);
router.use('/', schedulerRoutes);

module.exports = router;
