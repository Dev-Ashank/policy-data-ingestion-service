const PolicyRepository = require('../repositories/PolicyRepository');
const AgentRepository = require('../repositories/AgentRepository');
const UserRepository = require('../repositories/UserRepository');
const PolicyCategoryRepository = require('../repositories/PolicyCategoryRepository');
const PolicyCarrierRepository = require('../repositories/PolicyCarrierRepository');
const { logger } = require('../lib/logger');

class PolicyService {
    async createPolicy(policyData) {
        // Validation
        if (policyData.premiumAmount <= 0) {
            throw new Error('Premium amount must be positive');
        }

        const startDate = new Date(policyData.startDate);
        const endDate = new Date(policyData.endDate);

        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }

        // Get or create related entities
        const agent = await AgentRepository.findOrCreate(policyData.agentName);
        const user = await UserRepository.findOrCreate({
            name: policyData.userName || policyData.userEmail,
            email: policyData.userEmail,
            gender: policyData.gender
        });
        const category = await PolicyCategoryRepository.findOrCreate(policyData.categoryName);
        const carrier = await PolicyCarrierRepository.findOrCreate(policyData.companyName);

        // Create policy
        const policy = await PolicyRepository.create({
            policyNumber: policyData.policyNumber,
            policyMode: policyData.policyMode,
            producer: policyData.producer,
            premiumAmount: policyData.premiumAmount,
            policyType: policyData.policyType,
            csr: policyData.csr,
            startDate,
            endDate,
            agent: agent._id,
            user: user._id,
            policyCategory: category._id,
            policyCarrier: carrier._id
        });

        return policy;
    }

    async searchPolicies(searchParams, options = {}) {
        const query = {};

        if (searchParams.policyNumber) {
            query.policyNumber = searchParams.policyNumber;
        }

        if (searchParams.userEmail) {
            const user = await UserRepository.findByEmail(searchParams.userEmail);
            if (user) {
                query.user = user._id;
            } else {
                return options.page ? { data: [], pagination: { total: 0, page: options.page, limit: options.limit } } : [];
            }
        }

        if (searchParams.startDate || searchParams.endDate) {
            query.startDate = {};
            if (searchParams.startDate) {
                query.startDate.$gte = new Date(searchParams.startDate);
            }
            if (searchParams.endDate) {
                query.startDate.$lte = new Date(searchParams.endDate);
            }
        }

        const policies = await PolicyRepository.findAll(query);

        // Pagination
        if (options.page && options.limit) {
            const page = parseInt(options.page);
            const limit = parseInt(options.limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            return {
                data: policies.slice(startIndex, endIndex),
                pagination: {
                    total: policies.length,
                    page,
                    limit,
                    pages: Math.ceil(policies.length / limit)
                }
            };
        }

        return policies;
    }

    async aggregatePoliciesByUser(userEmail) {
        const user = await UserRepository.findByEmail(userEmail);

        if (!user) {
            throw new Error('User not found');
        }

        const result = await PolicyRepository.aggregateByUser(user._id);

        // Group by type
        const byType = {};
        result.policies.forEach(policy => {
            if (!byType[policy.policyType]) {
                byType[policy.policyType] = {
                    count: 0,
                    totalPremium: 0
                };
            }
            byType[policy.policyType].count++;
            byType[policy.policyType].totalPremium += policy.premiumAmount;
        });

        return {
            user: {
                name: user.name,
                email: user.email
            },
            totalPolicies: result.totalPolicies,
            totalPremium: result.totalPremium,
            byType,
            policies: result.policies
        };
    }

    async importPoliciesFromData(data) {
        const results = {
            success: true,
            imported: 0,
            failed: 0,
            errors: []
        };

        for (const row of data) {
            try {
                // Extract user name from firstname or account_name
                const userName = row.firstname || row.account_name || 'Unknown User';

                await this.createPolicy({
                    agentName: row.agent || 'Unknown Agent',
                    userName: userName,
                    userEmail: row.email || '',
                    gender: row.gender || '',
                    policyMode: row.policy_mode || 'Standard',
                    producer: row.producer || row.agent || 'Unknown Producer',
                    policyNumber: row.policy_number || '',
                    premiumAmount: parseFloat(row.premium_amount_written || row.premium_amount || 0),
                    policyType: row.policy_type || 'Individual',
                    companyName: row.company_name || 'Unknown Company',
                    categoryName: row.category_name || 'General',
                    startDate: row.policy_start_date || new Date(),
                    endDate: row.policy_end_date || new Date(),
                    csr: row.csr || ''
                });
                results.imported++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row,
                    error: error.message
                });
                logger.error(`Failed to import policy ${row.policy_number || 'undefined'}: ${error.message}`);
            }
        }

        return results;
    }
}

module.exports = new PolicyService();
