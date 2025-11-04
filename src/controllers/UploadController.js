const FileParserService = require('../services/FileParserService');
const PolicyService = require('../services/PolicyService');
const { logger } = require('../lib/logger');

class UploadController {
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const file = req.file;
            const fileExt = file.originalname.split('.').pop().toLowerCase();

            if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
                return res.status(400).json({ error: 'Invalid file format. Only CSV and XLSX files are allowed.' });
            }

            const fileType = ['xlsx', 'xls'].includes(fileExt) ? 'xlsx' : 'csv';
            const jobId = await FileParserService.startParsingJob(file.path, fileType);

            res.status(200).json({
                success: true,
                jobId,
                message: 'File uploaded successfully. Processing in background.',
                statusUrl: `/api/upload/status/${jobId}`
            });
        } catch (error) {
            logger.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to process upload' });
        }
    }

    async getJobStatus(req, res) {
        try {
            const { jobId } = req.params;
            const status = await FileParserService.getJobStatus(jobId);

            if (!status) {
                return res.status(404).json({ error: 'Job not found' });
            }

            res.status(200).json(status);
        } catch (error) {
            logger.error('Job status error:', error);
            res.status(500).json({ error: 'Failed to get job status' });
        }
    }
}

module.exports = new UploadController();
