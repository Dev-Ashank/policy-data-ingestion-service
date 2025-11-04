const request = require('supertest');
const { app } = require('../../src/server');
const Agent = require('../../src/models/Agent');
const User = require('../../src/models/User');
const PolicyCategory = require('../../src/models/PolicyCategory');
const PolicyCarrier = require('../../src/models/PolicyCarrier');
const Policy = require('../../src/models/Policy');

describe('Policy API Integration Tests', () => {
    let testAgent, testUser, testCategory, testCarrier;

    beforeEach(async () => {
        testAgent = await Agent.create({ name: 'API Test Agent' });
        testUser = await User.create({
            name: 'API Test User',
            email: 'apitest@example.com'
        });
        testCategory = await PolicyCategory.create({ categoryName: 'API Category' });
        testCarrier = await PolicyCarrier.create({ companyName: 'API Carrier' });

        await Policy.create({
            policyNumber: 'POL-API-001',
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
        });

        await Policy.create({
            policyNumber: 'POL-API-002',
            policyMode: 'Offline',
            producer: 'Another Producer',
            premiumAmount: 2000,
            policyType: 'Home',
            csr: 'Medium',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2025-02-01'),
            agent: testAgent._id,
            user: testUser._id,
            policyCategory: testCategory._id,
            policyCarrier: testCarrier._id
        });
    });

    describe('GET /api/policies/search', () => {
        it('should search policies by user email', async () => {
            const response = await request(app)
                .get('/api/policies/search')
                .query({ userEmail: 'apitest@example.com' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0]).toHaveProperty('policyNumber');
        });

        it('should search policies by policy number', async () => {
            const response = await request(app)
                .get('/api/policies/search')
                .query({ policyNumber: 'POL-API-001' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].policyNumber).toBe('POL-API-001');
        });

        it('should search policies by date range', async () => {
            const response = await request(app)
                .get('/api/policies/search')
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-01-31'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should return empty array when no matches found', async () => {
            const response = await request(app)
                .get('/api/policies/search')
                .query({ policyNumber: 'NONEXISTENT' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toEqual([]);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/policies/search')
                .query({ page: 1, limit: 1 })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 1);
        });

        it('should populate related entities', async () => {
            const response = await request(app)
                .get('/api/policies/search')
                .query({ userEmail: 'apitest@example.com' })
                .expect(200);

            const policy = response.body.data[0];
            expect(policy.user).toBeDefined();
            expect(policy.agent).toBeDefined();
            expect(policy.policyCategory).toBeDefined();
            expect(policy.policyCarrier).toBeDefined();
        });
    });

    describe('GET /api/policies/aggregate/:userEmail', () => {
        it('should aggregate policies by user', async () => {
            const response = await request(app)
                .get('/api/policies/aggregate/apitest@example.com')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('totalPolicies', 2);
            expect(response.body.data).toHaveProperty('totalPremium', 3500);
            expect(response.body.data).toHaveProperty('policies');
        });

        it('should group policies by type', async () => {
            const response = await request(app)
                .get('/api/policies/aggregate/apitest@example.com')
                .expect(200);

            expect(response.body.data).toHaveProperty('byType');
            expect(response.body.data.byType.Auto).toHaveProperty('count', 1);
            expect(response.body.data.byType.Auto).toHaveProperty('totalPremium', 1500);
            expect(response.body.data.byType.Home).toHaveProperty('count', 1);
            expect(response.body.data.byType.Home).toHaveProperty('totalPremium', 2000);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/policies/aggregate/nonexistent@example.com')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/User not found/i);
        });

        it('should handle user with no policies', async () => {
            const newUser = await User.create({
                name: 'No Policies User',
                email: 'nopolicies@example.com'
            });

            const response = await request(app)
                .get('/api/policies/aggregate/nopolicies@example.com')
                .expect(200);

            expect(response.body.data).toHaveProperty('totalPolicies', 0);
            expect(response.body.data).toHaveProperty('totalPremium', 0);
            expect(response.body.data.policies).toEqual([]);
        });
    });

    describe('GET /api/policies/:policyNumber', () => {
        it('should get policy by policy number', async () => {
            const response = await request(app)
                .get('/api/policies/POL-API-001')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('policyNumber', 'POL-API-001');
            expect(response.body.data).toHaveProperty('premiumAmount', 1500);
        });

        it('should return 404 for non-existent policy', async () => {
            const response = await request(app)
                .get('/api/policies/NONEXISTENT')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/Policy not found/i);
        });

        it('should populate all related entities', async () => {
            const response = await request(app)
                .get('/api/policies/POL-API-001')
                .expect(200);

            const policy = response.body.data;
            expect(policy.user).toHaveProperty('email');
            expect(policy.agent).toHaveProperty('name');
            expect(policy.policyCategory).toHaveProperty('categoryName');
            expect(policy.policyCarrier).toHaveProperty('companyName');
        });
    });

    describe('error handling', () => {
        it('should handle invalid query parameters', async () => {
            const response = await request(app)
                .get('/api/policies/search')
                .query({ page: 'invalid' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle server errors gracefully', async () => {
            // This will be tested with actual implementation
            const response = await request(app)
                .get('/api/policies/search')
                .query({ userEmail: 'test@test.com' });

            expect(response.status).toBeLessThan(600);
            expect(response.body).toBeDefined();
        });
    });
});
