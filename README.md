# Policy Data Ingestion Service

A Node.js + MongoDB service for ingesting policy data from CSV/XLSX files using worker threads, with scheduling capabilities and CPU monitoring.

## 📋 Features

- **File Upload & Processing**: Upload CSV/XLSX files and parse them using worker threads
- **MongoDB Storage**: Store data in Agent, User, Account, PolicyCategory, PolicyCarrier, and Policy collections
- **Search & Aggregation**: Search and aggregate policies by user
- **CPU Monitoring**: Automatically restart worker process if CPU usage exceeds threshold (default: 70%)
- **Job Scheduling**: Schedule messages for insertion at specific times using Agenda
- **Clean Architecture**: Follows SOLID principles, OOP, and Clean Architecture patterns
- **Test-Driven Development**: Comprehensive test suite with Jest, Supertest, and MongoDB Memory Server

## 🏗️ Architecture

```
/src
  /controllers      # HTTP request handlers
  /services         # Business logic
  /repositories     # Data access layer
  /models           # Mongoose schemas
  /workers          # Worker thread implementations
  /jobs             # Agenda job definitions
  /lib              # Shared utilities (logger, etc.)
  server.js         # Express application setup
  master.js         # Master process with CPU monitoring
/tests
  /unit             # Unit tests
  /integration      # Integration tests
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB 7.0 or higher
- Docker (optional, for containerized MongoDB)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dev-Ashank/policy-data-ingestion-service.git
cd policy-data-ingestion-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB (using Docker):
```bash
docker-compose up -d
```

### Running the Application

**Development mode with CPU monitoring:**
```bash
npm run dev
```

**Run tests:**
```bash
npm test
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

## 📮 API Testing

### Postman Collection

A complete Postman collection is available in the `PostManCollection/` folder for easy API testing:

**File:** `PostManCollection/policy-data-ingestion-service.postman_collection.json`

**How to use:**
1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `policy-data-ingestion-service.postman_collection.json`
4. The collection includes all endpoints with pre-configured requests

**Included Endpoints:**
- Health Check
- File Upload (CSV/XLSX)
- Upload Status Check
- Policy Search (by email, policy number, date range)
- Policy Aggregation
- Schedule Message
- Get/Cancel Scheduled Messages

This collection is ready to use for testing and demonstration purposes.

## 🔧 Configuration

Environment variables (`.env`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production/test) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/policy-data-ingestion` |
| `CPU_THRESHOLD` | CPU usage threshold for restart (%) | `70` |
| `AGENDA_DB_COLLECTION` | Agenda jobs collection name | `agendaJobs` |
| `MAX_FILE_SIZE` | Max upload file size (bytes) | `10485760` (10MB) |
| `UPLOAD_DIR` | Upload directory path | `./uploads` |
| `LOG_LEVEL` | Logging level | `info` |

## 📦 Tech Stack

### Core Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **multer** - File upload handling
- **exceljs** - Excel file parsing
- **csv-parser** - CSV file parsing
- **agenda** - Job scheduling
- **winston** - Logging
- **dotenv** - Environment variable management
- **pidusage** - CPU usage monitoring

### Dev Dependencies
- **jest** - Testing framework
- **supertest** - HTTP testing
- **mongodb-memory-server** - In-memory MongoDB for testing
- **nodemon** - Development auto-reload

## 🧪 Testing

This project follows Test-Driven Development (TDD) principles:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **MongoDB Memory Server**: All tests run against an in-memory database

Coverage threshold: ≥70% for branches, functions, lines, and statements

## 📝 Project Status

**Phase 1: Project Scaffold & Setup** ✅ COMPLETED

- ✅ Package.json with all dependencies
- ✅ Folder structure (controllers, services, repositories, models, workers, jobs, lib)
- ✅ Environment configuration (.env, .gitignore)
- ✅ Jest configuration with MongoDB Memory Server
- ✅ Minimal boilerplate (server.js, master.js, logger)
- ✅ Docker configuration for MongoDB
- ✅ README with setup instructions

**Phase 2: Write Test Suite First (TDD Red Phase)** ✅ COMPLETED

- ✅ Mongoose models for all entities (Agent, User, Account, PolicyCategory, PolicyCarrier, Policy)
- ✅ Repository unit tests (26 tests)
- ✅ Service unit tests (31 tests)
- ✅ Worker thread tests (10 tests)
- ✅ CPU monitor tests (15 tests)
- ✅ Integration tests for APIs (31 tests)
- ✅ Test fixtures and mock data
- ✅ Total: ~113 comprehensive tests
- ✅ All tests currently FAILING (as expected in TDD Red Phase)

See [TEST_SUITE.md](TEST_SUITE.md) for detailed test documentation.

## 👥 Author

Built following SOLID principles, Clean Architecture, and Test-Driven Development
