const PolicyService = require('../services/PolicyService');
const { logger } = require('../lib/logger');

class PolicyController {
    async searchPolicies(req, res) {
        try {
            const searchParams = {
                userEmail: req.query.userEmail,
                policyNumber: req.query.policyNumber,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };

            const options = {};
            if (req.query.page) {
                const page = parseInt(req.query.page);
                const limit = parseInt(req.query.limit) || 10;

                if (isNaN(page) || page < 1) {
                    return res.status(400).json({ error: 'Invalid page parameter' });
                }

                options.page = page;
                options.limit = limit;
            }

            const result = await PolicyService.searchPolicies(searchParams, options);

            res.status(200).json({
                success: true,
                data: options.page ? result.data : result,
                pagination: options.page ? result.pagination : undefined
            });
        } catch (error) {
            logger.error('Search error:', error);
            res.status(500).json({ error: 'Failed to search policies' });
        }
    }

    async aggregateByUser(req, res) {
        try {
            const { userEmail } = req.params;

            const result = await PolicyService.aggregatePoliciesByUser(userEmail);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }

            logger.error('Aggregation error:', error);
            res.status(500).json({ error: 'Failed to aggregate policies' });
        }
    }

    async getPolicyByNumber(req, res) {
        try {
            const { policyNumber } = req.params;

            const PolicyRepository = require('../repositories/PolicyRepository');
            const policy = await PolicyRepository.findByPolicyNumber(policyNumber);

            if (!policy) {
                return res.status(404).json({ error: 'Policy not found' });
            }

            // Populate related entities
            await policy.populate(['user', 'agent', 'policyCategory', 'policyCarrier']);

            res.status(200).json({
                success: true,
                data: policy
            });
        } catch (error) {
            logger.error('Get policy error:', error);
            res.status(500).json({ error: 'Failed to get policy' });
        }
    }
}

module.exports = new PolicyController();
