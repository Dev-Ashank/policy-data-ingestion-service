const { Worker } = require('worker_threads');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../lib/logger');

// In-memory job storage (in production, use Redis or MongoDB)
const jobs = new Map();

class FileParserService {
    async parseFile(filePath, fileType) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, '../workers/fileParser.worker.js'), {
                workerData: { filePath, fileType }
            });

            worker.on('message', (result) => {
                resolve(result);
            });

            worker.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    workerUsed: true
                });
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    resolve({
                        success: false,
                        error: `Worker stopped with exit code ${code}`,
                        workerUsed: true
                    });
                }
            });
        });
    }

    async startParsingJob(filePath, fileType) {
        const jobId = uuidv4();

        const job = {
            id: jobId,
            filePath,
            fileType,
            status: 'pending',
            recordsProcessed: 0,
            recordsFailed: 0,
            startedAt: new Date(),
            completedAt: null,
            error: null
        };

        jobs.set(jobId, job);

        // Start parsing in background
        this._processJob(jobId);

        return jobId;
    }

    async _processJob(jobId) {
        const job = jobs.get(jobId);
        if (!job) return;

        job.status = 'processing';

        try {
            // Step 1: Parse the file
            const result = await this.parseFile(job.filePath, job.fileType);

            if (result.success) {
                // Step 2: Import parsed data to database
                const PolicyService = require('./PolicyService');
                const importResult = await PolicyService.importPoliciesFromData(result.data);

                job.status = 'completed';
                job.recordsProcessed = importResult.successful;
                job.recordsFailed = importResult.failed;
                job.errors = importResult.errors;

                logger.info(`Job ${jobId} completed: ${importResult.successful} successful, ${importResult.failed} failed`);
            } else {
                job.status = 'failed';
                job.error = result.error;
            }
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            logger.error(`Job ${jobId} failed:`, error);
        } finally {
            job.completedAt = new Date();
            jobs.set(jobId, job);
        }
    }

    async getJobStatus(jobId) {
        const job = jobs.get(jobId);
        if (!job) {
            return null;
        }

        return {
            jobId: job.id,
            status: job.status,
            recordsProcessed: job.recordsProcessed,
            recordsFailed: job.recordsFailed,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            errors: job.errors || []
        };
    }
}

module.exports = new FileParserService();
