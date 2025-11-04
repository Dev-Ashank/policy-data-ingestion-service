const Agent = require('../models/Agent');

class AgentRepository {
    async create(agentData) {
        const agent = new Agent(agentData);
        return await agent.save();
    }

    async findByName(name) {
        return await Agent.findOne({ name });
    }

    async findOrCreate(name) {
        let agent = await this.findByName(name);
        if (!agent) {
            agent = await this.create({ name });
        }
        return agent;
    }

    async findAll() {
        return await Agent.find();
    }

    async findById(id) {
        return await Agent.findById(id);
    }
}

module.exports = new AgentRepository();
