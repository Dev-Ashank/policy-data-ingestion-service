const Agenda = require('agenda');
const mongoose = require('mongoose');
const { logger } = require('../lib/logger');

class SchedulerService {
    constructor() {
        this.agenda = null;
        this.initialized = false;
    }

    async getAgenda() {
        if (!this.agenda) {
            await this.initialize();
        }
        return this.agenda;
    }

    async initialize() {
        if (this.initialized) {
            return this.agenda;
        }

        // Use the same connection string as Mongoose (Singleton pattern for DB)
        const mongoConnectionString = process.env.MONGODB_URI || mongoose.connection.client.s.url;

        this.agenda = new Agenda({
            db: {
                address: mongoConnectionString,
                collection: process.env.AGENDA_DB_COLLECTION || 'agendaJobs'
            },
            processEvery: '1 second',
            maxConcurrency: 20
        });

        // Define jobs
        this.agenda.define('insert-message', async (job) => {
            const { message, metadata } = job.attrs.data;
            logger.info(`Executing scheduled message: ${message}`, { metadata });

            if (metadata && metadata.shouldFail) {
                throw new Error('Simulated failure');
            }

            // Message insertion logic would go here
            return { success: true, message };
        });

        await this.agenda.start();
        this.initialized = true;

        logger.info('Agenda scheduler initialized');
        return this.agenda;
    }

    async scheduleMessage(messageData) {
        const { message, scheduledFor, metadata } = messageData;

        // Validation
        if (!message || message.trim() === '') {
            throw new Error('Message cannot be empty');
        }

        const scheduleTime = new Date(scheduledFor);
        if (scheduleTime <= new Date()) {
            throw new Error('Scheduled time must be in the future');
        }

        const agenda = await this.getAgenda();

        const job = agenda.create('insert-message', {
            message,
            metadata
        });

        job.schedule(scheduleTime);
        await job.save();

        return {
            jobId: job.attrs._id.toString(),
            status: 'scheduled',
            scheduledFor: scheduleTime,
            message: 'Message scheduled successfully'
        };
    }

    async getScheduledMessages(filters = {}) {
        const agenda = await this.getAgenda();

        const query = { name: 'insert-message' };

        if (filters.status === 'scheduled') {
            query.nextRunAt = { $ne: null };
            query.lastFinishedAt = null;
        }

        const jobs = await agenda.jobs(query);

        return jobs.map(job => ({
            jobId: job.attrs._id.toString(),
            message: job.attrs.data.message,
            scheduledFor: job.attrs.nextRunAt,
            status: this._getJobStatus(job.attrs),
            metadata: job.attrs.data.metadata
        }));
    }

    async cancelScheduledMessage(jobId) {
        const agenda = await this.getAgenda();

        try {
            const numRemoved = await agenda.cancel({ _id: new mongoose.Types.ObjectId(jobId) });
            return numRemoved > 0;
        } catch (error) {
            logger.error(`Failed to cancel job ${jobId}:`, error);
            return false;
        }
    }

    async getJobStatus(jobId) {
        const agenda = await this.getAgenda();

        const jobs = await agenda.jobs({ _id: new mongoose.Types.ObjectId(jobId) });

        if (jobs.length === 0) {
            return null;
        }

        const job = jobs[0];
        return {
            jobId: job.attrs._id.toString(),
            status: this._getJobStatus(job.attrs),
            scheduledFor: job.attrs.nextRunAt,
            lastRun: job.attrs.lastRunAt,
            lastFinished: job.attrs.lastFinishedAt,
            failReason: job.attrs.failReason
        };
    }

    _getJobStatus(attrs) {
        if (attrs.lastFinishedAt) {
            return attrs.failReason ? 'failed' : 'completed';
        }
        if (attrs.lastRunAt) {
            return 'running';
        }
        if (attrs.nextRunAt) {
            return 'scheduled';
        }
        return 'queued';
    }

    async start() {
        const agenda = await this.getAgenda();
        await agenda.start();
    }

    async stop() {
        if (this.agenda) {
            await this.agenda.stop();
            this.initialized = false;
        }
    }

    async close() {
        if (this.agenda) {
            await this.agenda.stop();
            // Don't close the DB - we're reusing Mongoose's connection
            this.agenda = null;
            this.initialized = false;
        }
    }
}

module.exports = new SchedulerService();
