const Agent = require('../../../src/models/Agent');

describe('AgentRepository', () => {
    let AgentRepository;

    beforeAll(() => {
        // Repository will be implemented in Phase 3
        AgentRepository = require('../../../src/repositories/AgentRepository');
    }); describe('create', () => {
        it('should create a new agent', async () => {
            const agentData = { name: 'John Doe' };
            const result = await AgentRepository.create(agentData);

            expect(result).toBeDefined();
            expect(result.name).toBe(agentData.name);
            expect(result._id).toBeDefined();
        });

        it('should throw error when name is missing', async () => {
            await expect(AgentRepository.create({})).rejects.toThrow();
        });
    });

    describe('findByName', () => {
        it('should find agent by name', async () => {
            const agentData = { name: 'Jane Smith' };
            await AgentRepository.create(agentData);

            const result = await AgentRepository.findByName('Jane Smith');

            expect(result).toBeDefined();
            expect(result.name).toBe(agentData.name);
        });

        it('should return null if agent not found', async () => {
            const result = await AgentRepository.findByName('Non Existent');
            expect(result).toBeNull();
        });
    });

    describe('findOrCreate', () => {
        it('should return existing agent if found', async () => {
            const agentData = { name: 'Existing Agent' };
            const created = await AgentRepository.create(agentData);

            const result = await AgentRepository.findOrCreate('Existing Agent');

            expect(result._id.toString()).toBe(created._id.toString());
        });

        it('should create new agent if not found', async () => {
            const result = await AgentRepository.findOrCreate('New Agent');

            expect(result).toBeDefined();
            expect(result.name).toBe('New Agent');
            expect(result._id).toBeDefined();
        });
    });

    describe('findAll', () => {
        it('should return all agents', async () => {
            await AgentRepository.create({ name: 'Agent 1' });
            await AgentRepository.create({ name: 'Agent 2' });

            const results = await AgentRepository.findAll();

            expect(results).toHaveLength(2);
        });

        it('should return empty array when no agents exist', async () => {
            const results = await AgentRepository.findAll();
            expect(results).toEqual([]);
        });
    });
});
