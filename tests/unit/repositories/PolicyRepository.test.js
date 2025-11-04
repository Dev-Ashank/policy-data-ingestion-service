const Policy = require('../../../src/models/Policy');
const Agent = require('../../../src/models/Agent');
const User = require('../../../src/models/User');
const PolicyCategory = require('../../../src/models/PolicyCategory');
const PolicyCarrier = require('../../../src/models/PolicyCarrier');

describe('PolicyRepository', () => {
    let PolicyRepository;
    let testAgent, testUser, testCategory, testCarrier;

    beforeAll(() => {
        PolicyRepository = require('../../../src/repositories/PolicyRepository');
    }); beforeEach(async () => {
        // Create test dependencies
        testAgent = await Agent.create({ name: 'Test Agent' });
        testUser = await User.create({ name: 'Test User', email: 'test@example.com' });
        testCategory = await PolicyCategory.create({ categoryName: 'Test Category' });
        testCarrier = await PolicyCarrier.create({ companyName: 'Test Carrier' });
    });

    describe('create', () => {
        it('should create a new policy', async () => {
            const policyData = {
                policyNumber: 'POL-001',
                policyMode: 'Online',
                producer: 'Test Producer',
                premiumAmount: 1500,
                policyType: 'Auto',
                csr: 'High',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-01-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            };

            const result = await PolicyRepository.create(policyData);

            expect(result).toBeDefined();
            expect(result.policyNumber).toBe(policyData.policyNumber);
            expect(result.premiumAmount).toBe(policyData.premiumAmount);
        });

        it('should throw error when required fields are missing', async () => {
            const invalidData = { policyNumber: 'POL-002' };
            await expect(PolicyRepository.create(invalidData)).rejects.toThrow();
        });

        it('should throw error for duplicate policy number', async () => {
            const policyData = {
                policyNumber: 'POL-UNIQUE',
                policyMode: 'Online',
                producer: 'Producer',
                premiumAmount: 1000,
                policyType: 'Auto',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-01-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            };

            await PolicyRepository.create(policyData);
            await expect(PolicyRepository.create(policyData)).rejects.toThrow();
        });
    });

    describe('findByPolicyNumber', () => {
        it('should find policy by policy number', async () => {
            const policyData = {
                policyNumber: 'POL-FIND',
                policyMode: 'Offline',
                producer: 'Producer',
                premiumAmount: 2000,
                policyType: 'Home',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-01-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            };

            await PolicyRepository.create(policyData);
            const result = await PolicyRepository.findByPolicyNumber('POL-FIND');

            expect(result).toBeDefined();
            expect(result.policyNumber).toBe('POL-FIND');
        });

        it('should return null if policy not found', async () => {
            const result = await PolicyRepository.findByPolicyNumber('POL-NOTFOUND');
            expect(result).toBeNull();
        });
    });

    describe('findByUser', () => {
        it('should find all policies for a user', async () => {
            const policyData1 = {
                policyNumber: 'POL-USER-1',
                policyMode: 'Online',
                producer: 'Producer',
                premiumAmount: 1500,
                policyType: 'Auto',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-01-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            };

            const policyData2 = { ...policyData1, policyNumber: 'POL-USER-2' };

            await PolicyRepository.create(policyData1);
            await PolicyRepository.create(policyData2);

            const results = await PolicyRepository.findByUser(testUser._id);

            expect(results).toHaveLength(2);
            expect(results[0].user.toString()).toBe(testUser._id.toString());
        });

        it('should return empty array when user has no policies', async () => {
            const anotherUser = await User.create({
                name: 'Another User',
                email: 'another@example.com'
            });

            const results = await PolicyRepository.findByUser(anotherUser._id);
            expect(results).toEqual([]);
        });
    });

    describe('bulkCreate', () => {
        it('should create multiple policies', async () => {
            const policies = [
                {
                    policyNumber: 'POL-BULK-1',
                    policyMode: 'Online',
                    producer: 'Producer',
                    premiumAmount: 1000,
                    policyType: 'Auto',
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2025-01-01'),
                    agent: testAgent._id,
                    user: testUser._id,
                    policyCategory: testCategory._id,
                    policyCarrier: testCarrier._id
                },
                {
                    policyNumber: 'POL-BULK-2',
                    policyMode: 'Offline',
                    producer: 'Producer',
                    premiumAmount: 2000,
                    policyType: 'Home',
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2025-01-01'),
                    agent: testAgent._id,
                    user: testUser._id,
                    policyCategory: testCategory._id,
                    policyCarrier: testCarrier._id
                }
            ];

            const result = await PolicyRepository.bulkCreate(policies);

            expect(result).toBeDefined();
            expect(result.insertedCount).toBe(2);
        });
    });

    describe('aggregateByUser', () => {
        it('should aggregate policies by user with totals', async () => {
            const policyData1 = {
                policyNumber: 'POL-AGG-1',
                policyMode: 'Online',
                producer: 'Producer',
                premiumAmount: 1000,
                policyType: 'Auto',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-01-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            };

            const policyData2 = {
                ...policyData1,
                policyNumber: 'POL-AGG-2',
                premiumAmount: 2000
            };

            await PolicyRepository.create(policyData1);
            await PolicyRepository.create(policyData2);

            const result = await PolicyRepository.aggregateByUser(testUser._id);

            expect(result).toBeDefined();
            expect(result.totalPolicies).toBe(2);
            expect(result.totalPremium).toBe(3000);
        });
    });
});
