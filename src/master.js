const { fork } = require('child_process');
const pidusage = require('pidusage');
const { logger } = require('./lib/logger');
require('dotenv').config();

const CPU_THRESHOLD = parseInt(process.env.CPU_THRESHOLD) || 70;
const CHECK_INTERVAL = 5000; // Check every 5 seconds

class MasterProcess {
    constructor() {
        this.worker = null;
        this.monitoringInterval = null;
    }

    startWorker() {
        logger.info('Starting worker process...');
        this.worker = fork('./src/server.js');

        this.worker.on('exit', (code) => {
            logger.warn(`Worker process exited with code ${code}`);
            this.stopMonitoring();
        });

        this.worker.on('error', (error) => {
            logger.error('Worker process error:', error);
        });

        this.startMonitoring();
    }

    startMonitoring() {
        this.monitoringInterval = setInterval(async () => {
            if (!this.worker || !this.worker.pid) {
                return;
            }

            try {
                const stats = await pidusage(this.worker.pid);
                const cpuUsage = stats.cpu;

                logger.debug(`CPU Usage: ${cpuUsage.toFixed(2)}%`);

                if (cpuUsage >= CPU_THRESHOLD) {
                    logger.warn(`CPU usage (${cpuUsage.toFixed(2)}%) exceeded threshold (${CPU_THRESHOLD}%). Restarting worker...`);
                    await this.restartWorker();
                }
            } catch (error) {
                logger.error('Error monitoring CPU:', error);
            }
        }, CHECK_INTERVAL);
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    async restartWorker() {
        return new Promise((resolve) => {
            if (this.worker) {
                this.worker.once('exit', () => {
                    this.startWorker();
                    resolve();
                });
                this.worker.kill();
            } else {
                this.startWorker();
                resolve();
            }
        });
    }

    async shutdown() {
        logger.info('Master process shutting down...');
        this.stopMonitoring();

        if (this.worker) {
            this.worker.kill();
        }
    }
}

// Main execution
if (require.main === module) {
    const master = new MasterProcess();
    master.startWorker();

    // Handle termination signals
    process.on('SIGTERM', async () => {
        await master.shutdown();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        await master.shutdown();
        process.exit(0);
    });
}

module.exports = MasterProcess;
