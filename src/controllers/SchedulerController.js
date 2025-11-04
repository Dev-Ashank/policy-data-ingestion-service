const SchedulerService = require('../services/SchedulerService');
const { logger } = require('../lib/logger');

class SchedulerController {
    async scheduleMessage(req, res) {
        try {
            const { message, scheduledFor, metadata } = req.body;

            if (!message || !scheduledFor) {
                return res.status(400).json({ error: 'Message and scheduledFor are required' });
            }

            // Validate date
            const date = new Date(scheduledFor);
            if (isNaN(date.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const result = await SchedulerService.scheduleMessage({
                message,
                scheduledFor,
                metadata
            });

            res.status(201).json({
                success: true,
                ...result
            });
        } catch (error) {
            if (error.message.includes('must be in the future')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message.includes('cannot be empty')) {
                return res.status(400).json({ error: error.message });
            }

            logger.error('Schedule error:', error);
            res.status(500).json({ error: 'Failed to schedule message' });
        }
    }

    async getScheduledMessages(req, res) {
        try {
            const filters = {
                status: req.query.status
            };

            const messages = await SchedulerService.getScheduledMessages(filters);

            res.status(200).json({
                success: true,
                data: messages
            });
        } catch (error) {
            logger.error('Get messages error:', error);
            res.status(500).json({ error: 'Failed to get scheduled messages' });
        }
    }

    async cancelMessage(req, res) {
        try {
            const { jobId } = req.params;

            // Validate jobId format
            if (!jobId || jobId.length !== 24) {
                return res.status(400).json({ error: 'Invalid job ID format' });
            }

            const cancelled = await SchedulerService.cancelScheduledMessage(jobId);

            if (!cancelled) {
                return res.status(404).json({ error: 'Message not found or already processed' });
            }

            res.status(200).json({
                success: true,
                message: 'Message cancelled successfully'
            });
        } catch (error) {
            logger.error('Cancel error:', error);
            res.status(500).json({ error: 'Failed to cancel message' });
        }
    }

    async getMessageStatus(req, res) {
        try {
            const { jobId } = req.params;

            const status = await SchedulerService.getJobStatus(jobId);

            if (!status) {
                return res.status(404).json({ error: 'Message not found' });
            }

            res.status(200).json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Get status error:', error);
            res.status(500).json({ error: 'Failed to get message status' });
        }
    }
}

module.exports = new SchedulerController();
