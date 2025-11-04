const Agent = require('../../../src/models/Agent');
const User = require('../../../src/models/User');
const PolicyCategory = require('../../../src/models/PolicyCategory');
const PolicyCarrier = require('../../../src/models/PolicyCarrier');
const Policy = require('../../../src/models/Policy');

describe('PolicyService', () => {
    let PolicyService;
    let testAgent, testUser, testCategory, testCarrier;

    beforeAll(() => {
        PolicyService = require('../../../src/services/PolicyService');
    }); beforeEach(async () => {
        testAgent = await Agent.create({ name: 'Test Agent' });
        testUser = await User.create({ name: 'Test User', email: 'test@example.com' });
        testCategory = await PolicyCategory.create({ categoryName: 'Test Category' });
        testCarrier = await PolicyCarrier.create({ companyName: 'Test Carrier' });
    });

    describe('createPolicy', () => {
        it('should create a policy with valid data', async () => {
            const policyData = {
                policyNumber: 'POL-SERVICE-001',
                policyMode: 'Online',
                producer: 'Test Producer',
                premiumAmount: 1500,
                policyType: 'Auto',
                csr: 'High',
                startDate: '2024-01-01',
                endDate: '2025-01-01',
                agentName: testAgent.name,
                userEmail: testUser.email,
                categoryName: testCategory.categoryName,
                companyName: testCarrier.companyName
            };

            const result = await PolicyService.createPolicy(policyData);

            expect(result).toBeDefined();
            expect(result.policyNumber).toBe(policyData.policyNumber);
            expect(result.premiumAmount).toBe(policyData.premiumAmount);
        });

        it('should validate premium amount is positive', async () => {
            const policyData = {
                policyNumber: 'POL-NEGATIVE',
                policyMode: 'Online',
                producer: 'Producer',
                premiumAmount: -100,
                policyType: 'Auto',
                startDate: '2024-01-01',
                endDate: '2025-01-01',
                agentName: testAgent.name,
                userEmail: testUser.email,
                categoryName: testCategory.categoryName,
                companyName: testCarrier.companyName
            };

            await expect(PolicyService.createPolicy(policyData)).rejects.toThrow('Premium amount must be positive');
        });

        it('should validate end date is after start date', async () => {
            const policyData = {
                policyNumber: 'POL-DATES',
                policyMode: 'Online',
                producer: 'Producer',
                premiumAmount: 1000,
                policyType: 'Auto',
                startDate: '2025-01-01',
                endDate: '2024-01-01',
                agentName: testAgent.name,
                userEmail: testUser.email,
                categoryName: testCategory.categoryName,
                companyName: testCarrier.companyName
            };

            await expect(PolicyService.createPolicy(policyData)).rejects.toThrow('End date must be after start date');
        });

        it('should handle missing required fields', async () => {
            const policyData = {
                policyNumber: 'POL-INCOMPLETE'
            };

            await expect(PolicyService.createPolicy(policyData)).rejects.toThrow();
        });
    });

    describe('searchPolicies', () => {
        beforeEach(async () => {
            await Policy.create({
                policyNumber: 'POL-SEARCH-1',
                policyMode: 'Online',
                producer: 'Producer A',
                premiumAmount: 1000,
                policyType: 'Auto',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-01-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            });

            await Policy.create({
                policyNumber: 'POL-SEARCH-2',
                policyMode: 'Offline',
                producer: 'Producer B',
                premiumAmount: 2000,
                policyType: 'Home',
                startDate: new Date('2024-02-01'),
                endDate: new Date('2025-02-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            });
        });

        it('should search policies by user email', async () => {
            const result = await PolicyService.searchPolicies({ userEmail: testUser.email });

            expect(result).toHaveLength(2);
            expect(result[0].user.toString()).toBe(testUser._id.toString());
        });

        it('should search policies by policy number', async () => {
            const result = await PolicyService.searchPolicies({ policyNumber: 'POL-SEARCH-1' });

            expect(result).toHaveLength(1);
            expect(result[0].policyNumber).toBe('POL-SEARCH-1');
        });

        it('should search policies by date range', async () => {
            const result = await PolicyService.searchPolicies({
                startDate: '2024-01-01',
                endDate: '2024-01-31'
            });

            expect(result.length).toBeGreaterThan(0);
            result.forEach(policy => {
                expect(new Date(policy.startDate).getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
            });
        });

        it('should return empty array when no matches found', async () => {
            const result = await PolicyService.searchPolicies({ policyNumber: 'NONEXISTENT' });

            expect(result).toEqual([]);
        });

        it('should support pagination', async () => {
            const result = await PolicyService.searchPolicies({}, { page: 1, limit: 1 });

            expect(result.data).toHaveLength(1);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.total).toBe(2);
            expect(result.pagination.page).toBe(1);
        });
    });

    describe('aggregatePoliciesByUser', () => {
        beforeEach(async () => {
            await Policy.create({
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
            });

            await Policy.create({
                policyNumber: 'POL-AGG-2',
                policyMode: 'Offline',
                producer: 'Producer',
                premiumAmount: 1500,
                policyType: 'Home',
                startDate: new Date('2024-02-01'),
                endDate: new Date('2025-02-01'),
                agent: testAgent._id,
                user: testUser._id,
                policyCategory: testCategory._id,
                policyCarrier: testCarrier._id
            });
        });

        it('should aggregate policies by user with totals', async () => {
            const result = await PolicyService.aggregatePoliciesByUser(testUser.email);

            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.totalPolicies).toBe(2);
            expect(result.totalPremium).toBe(2500);
            expect(result.policies).toHaveLength(2);
        });

        it('should group policies by type', async () => {
            const result = await PolicyService.aggregatePoliciesByUser(testUser.email);

            expect(result.byType).toBeDefined();
            expect(result.byType.Auto.count).toBe(1);
            expect(result.byType.Auto.totalPremium).toBe(1000);
            expect(result.byType.Home.count).toBe(1);
            expect(result.byType.Home.totalPremium).toBe(1500);
        });

        it('should handle user with no policies', async () => {
            const newUser = await User.create({
                name: 'New User',
                email: 'newuser@example.com'
            });

            const result = await PolicyService.aggregatePoliciesByUser(newUser.email);

            expect(result.totalPolicies).toBe(0);
            expect(result.totalPremium).toBe(0);
            expect(result.policies).toEqual([]);
        });

        it('should throw error for non-existent user', async () => {
            await expect(
                PolicyService.aggregatePoliciesByUser('nonexistent@example.com')
            ).rejects.toThrow('User not found');
        });
    });

    describe('importPoliciesFromData', () => {
        it('should import multiple policies from parsed data', async () => {
            const data = [
                {
                    Agent: 'John Doe',
                    User: 'Alice Smith',
                    Email: 'alice@import.com',
                    Gender: 'Female',
                    'Policy Mode': 'Online',
                    Producer: 'Producer A',
                    'Policy Number': 'POL-IMPORT-1',
                    'Premium Amount': '1500',
                    'Policy Type': 'Auto',
                    Company: 'ABC Insurance',
                    Category: 'Vehicle',
                    'Start Date': '2024-01-01',
                    'End Date': '2025-01-01',
                    CSR: 'High'
                },
                {
                    Agent: 'Jane Smith',
                    User: 'Bob Williams',
                    Email: 'bob@import.com',
                    Gender: 'Male',
                    'Policy Mode': 'Offline',
                    Producer: 'Producer B',
                    'Policy Number': 'POL-IMPORT-2',
                    'Premium Amount': '2000',
                    'Policy Type': 'Home',
                    Company: 'XYZ Insurance',
                    Category: 'Property',
                    'Start Date': '2024-02-01',
                    'End Date': '2025-02-01',
                    CSR: 'Medium'
                }
            ];

            const result = await PolicyService.importPoliciesFromData(data);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.imported).toBe(2);
            expect(result.failed).toBe(0);
        });

        it('should handle partial failures gracefully', async () => {
            const data = [
                {
                    Agent: 'Valid Agent',
                    User: 'Valid User',
                    Email: 'valid@example.com',
                    'Policy Mode': 'Online',
                    Producer: 'Producer',
                    'Policy Number': 'POL-VALID',
                    'Premium Amount': '1000',
                    'Policy Type': 'Auto',
                    Company: 'Valid Company',
                    Category: 'Valid Category',
                    'Start Date': '2024-01-01',
                    'End Date': '2025-01-01'
                },
                {
                    'Policy Number': 'POL-INVALID',
                    // Missing required fields
                }
            ];

            const result = await PolicyService.importPoliciesFromData(data);

            expect(result.imported).toBe(1);
            expect(result.failed).toBe(1);
            expect(result.errors).toHaveLength(1);
        });

        it('should create related entities if they do not exist', async () => {
            const data = [{
                Agent: 'New Agent',
                User: 'New User',
                Email: 'newuser@example.com',
                'Policy Mode': 'Online',
                Producer: 'Producer',
                'Policy Number': 'POL-NEW',
                'Premium Amount': '1000',
                'Policy Type': 'Auto',
                Company: 'New Company',
                Category: 'New Category',
                'Start Date': '2024-01-01',
                'End Date': '2025-01-01'
            }];

            const result = await PolicyService.importPoliciesFromData(data);

            expect(result.success).toBe(true);
            expect(result.imported).toBe(1);

            // Verify entities were created
            const agent = await Agent.findOne({ name: 'New Agent' });
            const user = await User.findOne({ email: 'newuser@example.com' });
            const category = await PolicyCategory.findOne({ categoryName: 'New Category' });
            const carrier = await PolicyCarrier.findOne({ companyName: 'New Company' });

            expect(agent).toBeDefined();
            expect(user).toBeDefined();
            expect(category).toBeDefined();
            expect(carrier).toBeDefined();
        });
    });
});
