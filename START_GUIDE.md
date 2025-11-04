# Policy Data Ingestion Service - Startup Guide

## Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB** 7.0+ (or Docker)
- **npm** or **yarn**

---

## Quick Start (3 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings (optional - defaults work fine)
```

### 3. Start MongoDB & Run Service

#### Option A: Using Docker (Recommended)
```bash
# Start MongoDB in Docker
docker-compose up -d

# Run the service
npm run dev
```

#### Option B: Using Local MongoDB
```bash
# Make sure MongoDB is running locally on port 27017
# Then start the service
npm run dev
```

---

## Service Architecture

The service runs with a **Master-Worker pattern**:
- **Master Process** (`src/master.js`): Monitors CPU usage and manages worker
- **Worker Process** (`src/server.js`): Runs the Express API server

```
Master Process (monitors CPU)
    └── Worker Process (Express API on port 3000)
```

---

## Available Scripts

```bash
# Development (with auto-reload)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Verify Service is Running

### 1. Check Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T..."
}
```

### 2. Check Logs
You should see:
```
info: MongoDB connected successfully
info: Server running on port 3000
info: Starting worker process...
```

---

## API Endpoints

### File Upload
```bash
# Upload CSV file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@policies.csv"

# Upload XLSX file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@policies.xlsx"
```

### Search Policies
```bash
# Search by user email
curl "http://localhost:3000/api/policies/search?userEmail=john@example.com"

# Search by policy number
curl "http://localhost:3000/api/policies/search?policyNumber=POL123"
```

### Aggregate Policies
```bash
# Get aggregated data for a user
curl "http://localhost:3000/api/policies/aggregate/john@example.com"
```

### Schedule Messages
```bash
# Schedule a message
curl -X POST http://localhost:3000/api/schedule/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "scheduledFor": "2025-11-05T10:00:00Z"
  }'

# Get scheduled messages
curl http://localhost:3000/api/schedule/messages
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `MONGODB_URI` | mongodb://localhost:27017/policy-data-ingestion | MongoDB connection string |
| `CPU_THRESHOLD` | 70 | CPU usage % threshold for worker restart |
| `MAX_FILE_SIZE` | 10485760 | Max upload file size (10MB) |
| `LOG_LEVEL` | info | Logging level (debug/info/warn/error) |

---

## Stopping the Service

```bash
# Press Ctrl+C in the terminal where service is running

# Or if running in background
pkill -f "node.*master.js"

# Stop Docker MongoDB
docker-compose down
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### MongoDB Connection Error
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Or for local MongoDB
ps aux | grep mongod

# Restart MongoDB
docker-compose restart mongodb
```

### Worker Keeps Restarting
- Check CPU usage: `top` or `htop`
- Increase CPU_THRESHOLD in .env
- Check logs for errors

---

## Development Tips

### Running in Production
```bash
# Set NODE_ENV
export NODE_ENV=production

# Run with PM2 (recommended)
npm install -g pm2
pm2 start src/master.js --name policy-service

# View logs
pm2 logs policy-service
```

### Testing Individual Components
```bash
# Test specific file
npx jest tests/unit/services/PolicyService.test.js

# Test with specific pattern
npx jest --testNamePattern="should create a policy"
```

---

## Sample CSV Format

Create a `sample-policies.csv`:
```csv
Agent,User,Email,Gender,Category,Carrier,Policy Number,Premium Amount,Policy Type,Start Date,End Date
John Agent,John Doe,john@example.com,Male,Health,ABC Insurance,POL001,5000,Family,2024-01-01,2025-01-01
Jane Agent,Jane Smith,jane@example.com,Female,Auto,XYZ Insurance,POL002,3000,Individual,2024-02-01,2025-02-01
```

Upload it:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@sample-policies.csv"
```

---

## Architecture Features

✅ **Worker Threads**: CSV/XLSX parsing in separate threads  
✅ **CPU Monitoring**: Auto-restart if CPU > 70%  
✅ **Job Scheduling**: Agenda for scheduled tasks  
✅ **Clean Architecture**: Controllers → Services → Repositories  
✅ **TDD**: 128 tests (90 unit + 38 integration)  
✅ **SOLID Principles**: Proper separation of concerns

---

## Need Help?

Check logs: `tail -f logs/app.log` (if logging to file)  
Run tests: `npm test`  
Check health: `curl http://localhost:3000/health`
