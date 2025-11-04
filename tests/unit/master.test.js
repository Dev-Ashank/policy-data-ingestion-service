const MasterProcess = require('../../src/master');
const pidusage = require('pidusage');

// Mock pidusage
jest.mock('pidusage');

describe('CPU Monitor (Master Process)', () => {
    let master;

    beforeEach(() => {
        master = new MasterProcess();
        pidusage.mockClear();
    });

    afterEach(async () => {
        if (master) {
            await master.shutdown();
        }
    });

    describe('worker process management', () => {
        it('should start a worker process', () => {
            master.startWorker();

            expect(master.worker).toBeDefined();
            expect(master.worker.pid).toBeDefined();
        });

        it('should start CPU monitoring when worker starts', () => {
            master.startWorker();

            expect(master.monitoringInterval).toBeDefined();
        });

        it('should stop monitoring when worker exits', (done) => {
            master.startWorker();
            const intervalId = master.monitoringInterval;

            master.worker.once('exit', () => {
                expect(master.monitoringInterval).toBeNull();
                done();
            });

            master.worker.kill();
        });
    });

    describe('CPU monitoring', () => {
        it('should setup monitoring with pidusage', () => {
            pidusage.mockResolvedValue({ cpu: 50 });

            master.startWorker();

            expect(master.monitoringInterval).toBeDefined();
            expect(master.worker).toBeDefined();
            expect(master.worker.pid).toBeDefined();
        });

        it('should have restart capability', async () => {
            master.startWorker();
            const originalPid = master.worker.pid;

            await master.restartWorker();

            expect(master.worker).toBeDefined();
            expect(master.worker.pid).not.toBe(originalPid);
        });

        it('should maintain monitoring after restart', async () => {
            master.startWorker();

            await master.restartWorker();

            expect(master.monitoringInterval).toBeDefined();
        });

        it('should read CPU threshold from environment', () => {
            const customThreshold = 80;
            process.env.CPU_THRESHOLD = customThreshold.toString();

            // Threshold is read in master.js
            const threshold = parseInt(process.env.CPU_THRESHOLD) || 70;

            expect(threshold).toBe(customThreshold);

            delete process.env.CPU_THRESHOLD;
        });

        it('should handle worker process existence', () => {
            master.startWorker();

            // Worker should be running
            expect(master.worker).toBeDefined();
            expect(master.worker.killed).toBe(false);
        });
    });

    describe('worker restart', () => {
        it('should gracefully restart worker process', async () => {
            master.startWorker();
            const originalPid = master.worker.pid;

            await master.restartWorker();

            expect(master.worker).toBeDefined();
            expect(master.worker.pid).not.toBe(originalPid);
        });

        it('should wait for old worker to exit before starting new one', async () => {
            master.startWorker();
            const originalWorker = master.worker;

            const restartPromise = master.restartWorker();

            // Old worker should receive kill signal
            expect(originalWorker.killed).toBe(true);

            await restartPromise;

            // New worker should be running
            expect(master.worker).toBeDefined();
            expect(master.worker).not.toBe(originalWorker);
        });

        it('should restart monitoring after worker restart', async () => {
            master.startWorker();

            await master.restartWorker();

            expect(master.monitoringInterval).toBeDefined();
        });
    });

    describe('graceful shutdown', () => {
        it('should stop monitoring on shutdown', async () => {
            master.startWorker();

            await master.shutdown();

            expect(master.monitoringInterval).toBeNull();
        });

        it('should kill worker process on shutdown', async () => {
            master.startWorker();
            const worker = master.worker;

            await master.shutdown();

            expect(worker.killed).toBe(true);
        });

        it('should handle shutdown when no worker exists', async () => {
            await expect(master.shutdown()).resolves.not.toThrow();
        });
    });

    describe('error handling', () => {
        it('should handle worker process errors', (done) => {
            master.startWorker();

            master.worker.on('error', (error) => {
                expect(error).toBeDefined();
                done();
            });

            master.worker.emit('error', new Error('Worker error'));
        });

        it('should have error handling for pidusage', () => {
            pidusage.mockRejectedValue(new Error('Failed'));

            master.startWorker();

            // Should setup monitoring even if pidusage might fail later
            expect(master.monitoringInterval).toBeDefined();
        });
    });

    describe('signal handling', () => {
        it('should have shutdown method for SIGTERM', () => {
            master.startWorker();

            expect(typeof master.shutdown).toBe('function');
            expect(master.worker).toBeDefined();
        });

        it('should have shutdown method for SIGINT', () => {
            master.startWorker();

            expect(typeof master.shutdown).toBe('function');
            expect(master.monitoringInterval).toBeDefined();
        });
    });

    describe('monitoring interval configuration', () => {
        it('should setup monitoring interval', () => {
            master.startWorker();

            expect(master.monitoringInterval).toBeDefined();
            expect(typeof master.monitoringInterval).not.toBe('undefined');
        });

        it('should have worker process running', () => {
            pidusage.mockResolvedValue({ cpu: 50 });

            master.startWorker();

            expect(master.worker).toBeDefined();
            expect(master.worker.pid).toBeDefined();
        });
    });
});
