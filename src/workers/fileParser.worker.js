const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');

async function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function parseXLSX(filePath) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.worksheets[0];
        const results = [];

        const headers = [];
        worksheet.getRow(1).eachCell((cell) => {
            headers.push(cell.value);
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                rowData[header] = cell.value;
            });

            results.push(rowData);
        });

        return results;
    } catch (error) {
        throw error;
    }
}

async function parse() {
    const { filePath, fileType } = workerData;

    try {
        let data;

        if (fileType === 'csv') {
            data = await parseCSV(filePath);
        } else if (fileType === 'xlsx') {
            data = await parseXLSX(filePath);
        } else {
            throw new Error(`Unsupported file type: ${fileType}`);
        }

        parentPort.postMessage({
            success: true,
            data,
            workerUsed: true
        });
    } catch (error) {
        parentPort.postMessage({
            success: false,
            error: error.message,
            workerUsed: true
        });
    }
}

parse();
