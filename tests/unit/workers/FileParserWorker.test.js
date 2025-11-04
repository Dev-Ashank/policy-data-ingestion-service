const path = require('path');
const fs = require('fs').promises;

describe('FileParserWorker', () => {
    let FileParserService;
    const testFilesDir = path.join(__dirname, '../../fixtures/files');

    beforeAll(async () => {
        FileParserService = require('../../../src/services/FileParserService');

        // Ensure test files directory exists
        await fs.mkdir(testFilesDir, { recursive: true });
    }); afterAll(async () => {
        // Clean up test files
        try {
            const files = await fs.readdir(testFilesDir);
            await Promise.all(files.map(file => fs.unlink(path.join(testFilesDir, file))));
        } catch (error) {
            // Ignore errors
        }
    });

    describe('parseCSV', () => {
        it('should parse CSV file using worker thread', async () => {
            const csvContent = `Agent,User,Email,Gender,Policy Mode,Producer,Policy Number,Premium Amount,Policy Type,Company,Category,Start Date,End Date,CSR
John Doe,Alice Smith,alice@example.com,Female,Online,Bob Johnson,POL-001,1500,Auto,ABC Insurance,Vehicle,2024-01-01,2025-01-01,High
Jane Smith,Bob Williams,bob@example.com,Male,Offline,Carol Davis,POL-002,2000,Home,XYZ Insurance,Property,2024-02-01,2025-02-01,Medium`;

            const filePath = path.join(testFilesDir, 'test.csv');
            await fs.writeFile(filePath, csvContent);

            const result = await FileParserService.parseFile(filePath, 'csv');

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].Agent).toBe('John Doe');
            expect(result.data[0]['Policy Number']).toBe('POL-001');
        });

        it('should handle empty CSV file', async () => {
            const csvContent = `Agent,User,Email`;
            const filePath = path.join(testFilesDir, 'empty.csv');
            await fs.writeFile(filePath, csvContent);

            const result = await FileParserService.parseFile(filePath, 'csv');

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(0);
        });

        it('should handle malformed CSV', async () => {
            const csvContent = `Agent,User
John,Doe
Jane`;
            const filePath = path.join(testFilesDir, 'malformed.csv');
            await fs.writeFile(filePath, csvContent);

            const result = await FileParserService.parseFile(filePath, 'csv');

            // csv-parser is flexible and will parse this successfully
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });
    });

    describe('parseXLSX', () => {
        it('should parse XLSX file using worker thread', async () => {
            // This test will require actual XLSX file creation in Phase 3
            // For now, we test the interface
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Policies');

            worksheet.columns = [
                { header: 'Agent', key: 'Agent' },
                { header: 'User', key: 'User' },
                { header: 'Email', key: 'Email' },
                { header: 'Policy Number', key: 'Policy Number' }
            ];

            worksheet.addRow({
                Agent: 'John Doe',
                User: 'Alice Smith',
                Email: 'alice@example.com',
                'Policy Number': 'POL-001'
            });

            const filePath = path.join(testFilesDir, 'test.xlsx');
            await workbook.xlsx.writeFile(filePath);

            const result = await FileParserService.parseFile(filePath, 'xlsx');

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(0);
        });

        it('should handle invalid XLSX file', async () => {
            const filePath = path.join(testFilesDir, 'invalid.xlsx');
            await fs.writeFile(filePath, 'not an xlsx file');

            const result = await FileParserService.parseFile(filePath, 'xlsx');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('worker thread isolation', () => {
        it('should use worker threads for parsing', async () => {
            const csvContent = `Agent,User,Email
John Doe,Alice Smith,alice@example.com`;
            const filePath = path.join(testFilesDir, 'worker-test.csv');
            await fs.writeFile(filePath, csvContent);

            const result = await FileParserService.parseFile(filePath, 'csv');

            expect(result.workerUsed).toBe(true);
            expect(result.success).toBe(true);
        });

        it('should handle worker errors gracefully', async () => {
            const result = await FileParserService.parseFile('/nonexistent/file.csv', 'csv');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('job status tracking', () => {
        it('should track parsing job status', async () => {
            const csvContent = `Agent,User,Email
John Doe,Alice Smith,alice@example.com`;
            const filePath = path.join(testFilesDir, 'status-test.csv');
            await fs.writeFile(filePath, csvContent);

            const jobId = await FileParserService.startParsingJob(filePath, 'csv');

            expect(jobId).toBeDefined();

            const status = await FileParserService.getJobStatus(jobId);
            expect(status).toBeDefined();
            expect(['pending', 'processing', 'completed', 'failed']).toContain(status.status);
        });

        it('should update job status on completion', async () => {
            const csvContent = `Agent,User,Email
John Doe,Alice Smith,alice@example.com`;
            const filePath = path.join(testFilesDir, 'completion-test.csv');
            await fs.writeFile(filePath, csvContent);

            const jobId = await FileParserService.startParsingJob(filePath, 'csv');

            // Wait for job to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            const status = await FileParserService.getJobStatus(jobId);
            expect(status.status).toBe('completed');
            expect(status.recordsProcessed).toBeGreaterThan(0);
        });

        it('should update job status on failure', async () => {
            const jobId = await FileParserService.startParsingJob('/invalid/path.csv', 'csv');

            // Wait for job to fail
            await new Promise(resolve => setTimeout(resolve, 1000));

            const status = await FileParserService.getJobStatus(jobId);
            expect(status.status).toBe('failed');
            expect(status.error).toBeDefined();
        });
    });
});
