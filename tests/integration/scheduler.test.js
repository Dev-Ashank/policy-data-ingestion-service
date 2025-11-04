const request = require('supertest');
const { app } = require('../../src/server');

describe('Scheduler API Integration Tests', () => {
    describe('POST /api/schedule/message', () => {
        it('should schedule a message for future delivery', async () => {
            const messageData = {
                message: 'Test scheduled message',
                scheduledFor: new Date(Date.now() + 60000).toISOString()
            };

            const response = await request(app)
                .post('/api/schedule/message')
                .send(messageData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('jobId');
            expect(response.body).toHaveProperty('message', 'Message scheduled successfully');
            expect(response.body).toHaveProperty('scheduledFor');
        });

        it('should reject message with past scheduled time', async () => {
            const messageData = {
                message: 'Past message',
                scheduledFor: new Date(Date.now() - 60000).toISOString()
            };

            const response = await request(app)
                .post('/api/schedule/message')
                .send(messageData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/must be in the future/i);
        });

        it('should reject empty message', async () => {
            const messageData = {
                message: '',
                scheduledFor: new Date(Date.now() + 60000).toISOString()
            };

            const response = await request(app)
                .post('/api/schedule/message')
                .send(messageData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/are required/i);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/schedule/message')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle invalid date format', async () => {
            const messageData = {
                message: 'Test message',
                scheduledFor: 'invalid-date'
            };

            const response = await request(app)
                .post('/api/schedule/message')
                .send(messageData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should accept additional metadata', async () => {
            const messageData = {
                message: 'Message with metadata',
                scheduledFor: new Date(Date.now() + 60000).toISOString(),
                metadata: {
                    userId: '123',
                    priority: 'high',
                    category: 'notification'
                }
            };

            const response = await request(app)
                .post('/api/schedule/message')
                .send(messageData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('jobId');
        });
    });

    describe('GET /api/schedule/messages', () => {
        beforeEach(async () => {
            // Schedule some test messages
            await request(app)
                .post('/api/schedule/message')
                .send({
                    message: 'Test message 1',
                    scheduledFor: new Date(Date.now() + 60000).toISOString()
                });

            await request(app)
                .post('/api/schedule/message')
                .send({
                    message: 'Test message 2',
                    scheduledFor: new Date(Date.now() + 120000).toISOString()
                });
        });

        it('should retrieve all scheduled messages', async () => {
            const response = await request(app)
                .get('/api/schedule/messages')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should include job details in response', async () => {
            const response = await request(app)
                .get('/api/schedule/messages')
                .expect(200);

            const message = response.body.data[0];
            expect(message).toHaveProperty('jobId');
            expect(message).toHaveProperty('message');
            expect(message).toHaveProperty('scheduledFor');
            expect(message).toHaveProperty('status');
        });

        it('should filter messages by status', async () => {
            const response = await request(app)
                .get('/api/schedule/messages')
                .query({ status: 'scheduled' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('DELETE /api/schedule/message/:jobId', () => {
        it('should cancel a scheduled message', async () => {
            const scheduleResponse = await request(app)
                .post('/api/schedule/message')
                .send({
                    message: 'To be cancelled',
                    scheduledFor: new Date(Date.now() + 60000).toISOString()
                });

            const jobId = scheduleResponse.body.jobId;

            const response = await request(app)
                .delete(`/api/schedule/message/${jobId}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Message cancelled successfully');
        });

        it('should return 404 for non-existent job', async () => {
            const fakeJobId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .delete(`/api/schedule/message/${fakeJobId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/not found/i);
        });

        it('should handle invalid job ID format', async () => {
            const response = await request(app)
                .delete('/api/schedule/message/invalid-id')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/schedule/message/:jobId/status', () => {
        it('should get status of scheduled message', async () => {
            const scheduleResponse = await request(app)
                .post('/api/schedule/message')
                .send({
                    message: 'Status check',
                    scheduledFor: new Date(Date.now() + 60000).toISOString()
                });

            const jobId = scheduleResponse.body.jobId;

            const response = await request(app)
                .get(`/api/schedule/message/${jobId}/status`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('jobId', jobId);
            expect(response.body.data).toHaveProperty('status');
            expect(['scheduled', 'completed', 'failed', 'queued']).toContain(
                response.body.data.status
            );
        });

        it('should return 404 for non-existent job', async () => {
            const fakeJobId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .get(`/api/schedule/message/${fakeJobId}/status`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });
});
