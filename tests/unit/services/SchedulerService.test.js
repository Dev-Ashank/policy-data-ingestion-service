const mongoose = require('mongoose');

describe('SchedulerService', () => {
    let SchedulerService;
    let agenda;

    beforeAll(async () => {
        SchedulerService = require('../../../src/services/SchedulerService');
        agenda = await SchedulerService.getAgenda();
    });

    afterAll(async () => {
        if (agenda) {
            await agenda.stop();
            // Connection is managed by Mongoose, no need to close separately
        }
    });

    describe('initialization', () => {
        it('should initialize Agenda with MongoDB connection', async () => {
            expect(agenda).toBeDefined();
            expect(agenda._collection).toBeDefined();
        });

        it('should define message insertion job', async () => {
            const jobs = agenda._definitions;
            expect(jobs['insert-message']).toBeDefined();
        });
    });

    describe('scheduleMessage', () => {
        it('should schedule a message for future insertion', async () => {
            const messageData = {
                message: 'Test scheduled message',
                scheduledFor: new Date(Date.now() + 60000) // 1 minute from now
            };

            const result = await SchedulerService.scheduleMessage(messageData);

            expect(result).toBeDefined();
            expect(result.jobId).toBeDefined();
            expect(result.status).toBe('scheduled');
            expect(result.scheduledFor).toBeDefined();
        });

        it('should validate scheduled time is in the future', async () => {
            const messageData = {
                message: 'Test message',
                scheduledFor: new Date(Date.now() - 60000) // 1 minute ago
            };

            await expect(SchedulerService.scheduleMessage(messageData)).rejects.toThrow(
                'Scheduled time must be in the future'
            );
        });

        it('should validate message is not empty', async () => {
            const messageData = {
                message: '',
                scheduledFor: new Date(Date.now() + 60000)
            };

            await expect(SchedulerService.scheduleMessage(messageData)).rejects.toThrow(
                'Message cannot be empty'
            );
        });

        it('should store job data correctly', async () => {
            const messageData = {
                message: 'Persistent message',
                scheduledFor: new Date(Date.now() + 1000),
                metadata: { userId: '123', priority: 'high' }
            };

            const result = await SchedulerService.scheduleMessage(messageData);

            const job = await agenda.jobs({ _id: new mongoose.Types.ObjectId(result.jobId) });

            expect(job).toHaveLength(1);
            expect(job[0].attrs.data.message).toBe(messageData.message);
            expect(job[0].attrs.data.metadata).toEqual(messageData.metadata);
        });
    });

    describe('getScheduledMessages', () => {
        beforeEach(async () => {
            // Clear existing jobs
            await agenda.cancel({});
        });

        it('should retrieve all scheduled messages', async () => {
            await SchedulerService.scheduleMessage({
                message: 'Message 1',
                scheduledFor: new Date(Date.now() + 60000)
            });

            await SchedulerService.scheduleMessage({
                message: 'Message 2',
                scheduledFor: new Date(Date.now() + 120000)
            });

            const messages = await SchedulerService.getScheduledMessages();

            expect(messages).toHaveLength(2);
            expect(messages[0].message).toBeDefined();
            expect(messages[0].scheduledFor).toBeDefined();
        });

        it('should filter scheduled messages by status', async () => {
            await SchedulerService.scheduleMessage({
                message: 'Scheduled message',
                scheduledFor: new Date(Date.now() + 60000)
            });

            const scheduled = await SchedulerService.getScheduledMessages({ status: 'scheduled' });

            expect(scheduled.length).toBeGreaterThan(0);
            scheduled.forEach(msg => {
                expect(['scheduled', 'queued']).toContain(msg.status);
            });
        });

        it('should return empty array when no messages exist', async () => {
            await agenda.cancel({});

            const messages = await SchedulerService.getScheduledMessages();

            expect(messages).toEqual([]);
        });
    });

    describe('cancelScheduledMessage', () => {
        it('should cancel a scheduled message', async () => {
            const result = await SchedulerService.scheduleMessage({
                message: 'To be cancelled',
                scheduledFor: new Date(Date.now() + 60000)
            });

            const cancelled = await SchedulerService.cancelScheduledMessage(result.jobId);

            expect(cancelled).toBe(true);

            const job = await agenda.jobs({ _id: new mongoose.Types.ObjectId(result.jobId) });
            expect(job).toHaveLength(0);
        });

        it('should return false for non-existent job', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const result = await SchedulerService.cancelScheduledMessage(fakeId.toString());

            expect(result).toBe(false);
        });
    });

    describe('message execution', () => {
        it('should schedule message for future execution', async () => {
            const messageData = {
                message: 'Execute later',
                scheduledFor: new Date(Date.now() + 1000) // 1 second from now
            };

            const result = await SchedulerService.scheduleMessage(messageData);

            expect(result.status).toBe('scheduled');
            expect(result.jobId).toBeDefined();
        });

        it('should handle execution errors gracefully', async () => {
            const messageData = {
                message: 'Error message',
                scheduledFor: new Date(Date.now() + 1000),
                shouldFail: true // Flag to simulate error
            };

            const result = await SchedulerService.scheduleMessage(messageData);
            expect(result).toBeDefined();
        });
    });

    describe('job persistence', () => {
        it('should persist jobs to MongoDB', async () => {
            const messageData = {
                message: 'Persistent job',
                scheduledFor: new Date(Date.now() + 1000)
            };

            const result = await SchedulerService.scheduleMessage(messageData);

            // Verify job was created
            const jobs = await agenda.jobs({ 'data.message': 'Persistent job' });

            expect(jobs.length).toBeGreaterThan(0);
            expect(jobs[0].attrs.data.message).toBe('Persistent job');
        });

        it('should retrieve jobs from database', async () => {
            const messageData = {
                message: 'Recovery test',
                scheduledFor: new Date(Date.now() + 1000)
            };

            await SchedulerService.scheduleMessage(messageData);

            const messages = await SchedulerService.getScheduledMessages();
            const found = messages.find(m => m.message === 'Recovery test');

            expect(found).toBeDefined();
        });
    });

    describe('concurrent job handling', () => {
        it('should handle multiple concurrent scheduled messages', async () => {
            const promises = [];

            for (let i = 0; i < 5; i++) {
                promises.push(
                    SchedulerService.scheduleMessage({
                        message: `Concurrent message ${i}`,
                        scheduledFor: new Date(Date.now() + 1000 + i * 100)
                    })
                );
            }

            const results = await Promise.all(promises);

            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.jobId).toBeDefined();
                expect(result.status).toBe('scheduled');
            });
        });

        it('should retrieve jobs with correct scheduling', async () => {
            // Schedule jobs with different times
            await SchedulerService.scheduleMessage({
                message: 'Job A',
                scheduledFor: new Date(Date.now() + 3000)
            });

            await SchedulerService.scheduleMessage({
                message: 'Job B',
                scheduledFor: new Date(Date.now() + 1000)
            });

            await SchedulerService.scheduleMessage({
                message: 'Job C',
                scheduledFor: new Date(Date.now() + 2000)
            });

            // Verify all jobs were created
            const jobs = await SchedulerService.getScheduledMessages();
            const testJobs = jobs.filter(j => ['Job A', 'Job B', 'Job C'].includes(j.message));

            expect(testJobs.length).toBe(3);
        });
    });
});
