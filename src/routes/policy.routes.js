const express = require('express');
const PolicyController = require('../controllers/PolicyController');

const router = express.Router();

router.get('/policies/search', PolicyController.searchPolicies);
router.get('/policies/aggregate/:userEmail', PolicyController.aggregateByUser);
router.get('/policies/:policyNumber', PolicyController.getPolicyByNumber);

module.exports = router;
