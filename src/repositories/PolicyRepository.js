const Policy = require('../models/Policy');

class PolicyRepository {
    async create(policyData) {
        const policy = new Policy(policyData);
        return await policy.save();
    }

    async findByPolicyNumber(policyNumber) {
        return await Policy.findOne({ policyNumber });
    }

    async findByUser(userId) {
        return await Policy.find({ user: userId });
    }

    async bulkCreate(policies) {
        const result = await Policy.insertMany(policies, { ordered: false });
        return { insertedCount: result.length };
    }

    async aggregateByUser(userId) {
        const policies = await this.findByUser(userId);

        const totalPolicies = policies.length;
        const totalPremium = policies.reduce((sum, policy) => sum + policy.premiumAmount, 0);

        return {
            totalPolicies,
            totalPremium,
            policies
        };
    }

    async findAll(query = {}) {
        return await Policy.find(query);
    }

    async findById(id) {
        return await Policy.findById(id);
    }
}

module.exports = new PolicyRepository();
