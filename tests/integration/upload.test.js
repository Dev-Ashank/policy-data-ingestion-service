const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const { app } = require('../../src/server');

describe('File Upload API Integration Tests', () => {
    const testFilesDir = path.join(__dirname, '../fixtures/files');

    beforeAll(async () => {
        await fs.mkdir(testFilesDir, { recursive: true });
    });

    describe('POST /api/upload', () => {
        it('should upload and process CSV file', async () => {
            const csvContent = `Agent,User,Email,Gender,Policy Mode,Producer,Policy Number,Premium Amount,Policy Type,Company,Category,Start Date,End Date,CSR
John Doe,Alice Smith,alice@test.com,Female,Online,Bob Johnson,POL-TEST-001,1500,Auto,ABC Insurance,Vehicle,2024-01-01,2025-01-01,High`;

            const filePath = path.join(testFilesDir, 'upload-test.csv');
            await fs.writeFile(filePath, csvContent);

            const response = await request(app)
                .post('/api/upload')
                .attach('file', filePath)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('jobId');
            expect(response.body).toHaveProperty('message');
        });

        it('should upload and process XLSX file', async () => {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Policies');

            worksheet.columns = [
                { header: 'Agent', key: 'Agent' },
                { header: 'User', key: 'User' },
                { header: 'Email', key: 'Email' },
                { header: 'Policy Number', key: 'Policy Number' },
                { header: 'Premium Amount', key: 'Premium Amount' }
            ];

            worksheet.addRow({
                Agent: 'Test Agent',
                User: 'Test User',
                Email: 'test@xlsx.com',
                'Policy Number': 'POL-XLSX-001',
                'Premium Amount': 2000
            });

            const filePath = path.join(testFilesDir, 'upload-test.xlsx');
            await workbook.xlsx.writeFile(filePath);

            const response = await request(app)
                .post('/api/upload')
                .attach('file', filePath)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('jobId');
        });

        it('should reject file with invalid format', async () => {
            const filePath = path.join(testFilesDir, 'invalid.txt');
            await fs.writeFile(filePath, 'Invalid content');

            const response = await request(app)
                .post('/api/upload')
                .attach('file', filePath)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/Invalid file type/i);
        });

        it('should reject request without file', async () => {
            const response = await request(app)
                .post('/api/upload')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/No file uploaded/i);
        });

        it('should reject file exceeding size limit', async () => {
            const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
            const filePath = path.join(testFilesDir, 'large.csv');
            await fs.writeFile(filePath, largeContent);

            const response = await request(app)
                .post('/api/upload')
                .attach('file', filePath)
                .expect(413);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/File too large/i);
        });

        it('should return job status endpoint in response', async () => {
            const csvContent = `Agent,User,Email
John Doe,Alice Smith,alice@status.com`;

            const filePath = path.join(testFilesDir, 'status-test.csv');
            await fs.writeFile(filePath, csvContent);

            const response = await request(app)
                .post('/api/upload')
                .attach('file', filePath)
                .expect(200);

            expect(response.body).toHaveProperty('statusUrl');
            expect(response.body.statusUrl).toContain('/api/upload/status/');
        });
    });

    describe('GET /api/upload/status/:jobId', () => {
        it('should return job status', async () => {
            const csvContent = `Agent,User,Email
John Doe,Alice Smith,alice@jobstatus.com`;

            const filePath = path.join(testFilesDir, 'job-status-test.csv');
            await fs.writeFile(filePath, csvContent);

            const uploadResponse = await request(app)
                .post('/api/upload')
                .attach('file', filePath);

            const jobId = uploadResponse.body.jobId;

            const response = await request(app)
                .get(`/api/upload/status/${jobId}`)
                .expect(200);

            expect(response.body).toHaveProperty('jobId', jobId);
            expect(response.body).toHaveProperty('status');
            expect(['pending', 'processing', 'completed', 'failed']).toContain(
                response.body.status
            );
        });

        it('should return 404 for non-existent job', async () => {
            const fakeJobId = 'nonexistent-job-id';

            const response = await request(app)
                .get(`/api/upload/status/${fakeJobId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/Job not found/i);
        });

        it('should include processing statistics', async () => {
            const csvContent = `Agent,User,Email
John Doe,Alice Smith,alice@stats.com
Jane Smith,Bob Williams,bob@stats.com`;

            const filePath = path.join(testFilesDir, 'stats-test.csv');
            await fs.writeFile(filePath, csvContent);

            const uploadResponse = await request(app)
                .post('/api/upload')
                .attach('file', filePath);

            const jobId = uploadResponse.body.jobId;

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await request(app)
                .get(`/api/upload/status/${jobId}`)
                .expect(200);

            if (response.body.status === 'completed') {
                expect(response.body).toHaveProperty('recordsProcessed');
                expect(response.body).toHaveProperty('recordsFailed');
            }
        });
    });
});
