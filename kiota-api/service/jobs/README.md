# Queue System Documentation

## Overview

The Kiota API uses **Bull** (backed by Redis) for background job processing. This ensures reliable, scalable deposit processing with automatic retries and monitoring.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│  API Server │─────▶│    Redis    │◀─────│    Worker    │
│  (Express)  │      │   (Queue)   │      │  (Processor) │
└─────────────┘      └─────────────┘      └──────────────┘
       │                    │                      │
       │ Add jobs           │ Store jobs           │ Process jobs
       ▼                    ▼                      ▼
   User requests      Job persistence        Blockchain ops
```

## Components

### 1. Queues (`/configs/queue.config.ts`)
- **deposit-completion** - Processes M-Pesa deposits
- **onchain-deposit-confirmation** - Scans blockchain for USDC transfers

### 2. Processors (`/jobs/processors/`)
- **deposit-completion.processor.ts** - Credits portfolio for M-Pesa deposits
- **onchain-deposit-confirmation.processor.ts** - Confirms USDC deposits

### 3. Worker (`/jobs/worker.ts`)
- Standalone process that picks up and processes jobs
- Runs independently from API server
- Can scale horizontally (run multiple workers)

### 4. Bull Board (`/configs/bull-board.config.ts`)
- Visual dashboard for monitoring jobs
- Access: `http://localhost:3000/admin/queues`

## Setup

### Prerequisites

1. **Install Redis**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

2. **Configure Environment Variables**

Add to `.env.development`:
```env
REDIS_URL="redis://localhost:6379"
BASE_RPC_URL="https://sepolia.base.org"
BASE_USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
DEPOSIT_CONFIRMATIONS_REQUIRED=2
```

### Running the System

**Terminal 1: Start API Server**
```bash
npm run dev
```

**Terminal 2: Start Worker**
```bash
npm run worker
```

**Terminal 3: Monitor Jobs (optional)**
```bash
# Open browser
open http://localhost:3003/admin/queues
```

## How It Works

### M-Pesa Deposit Flow

1. User initiates M-Pesa deposit via `/api/v1/deposit/initiate`
2. M-Pesa sends callback to `/api/v1/deposit/mpesa-callback`
3. Callback handler adds job to `deposit-completion` queue
4. Worker picks up job and:
   - Writes transaction to blockchain
   - Credits user's portfolio
   - Updates wallet balances
5. If blockchain RPC fails, job retries automatically (5 attempts)

**Code:**
```typescript
// In mpesaCallback handler
await DEPOSIT_COMPLETION_QUEUE.add({
  transactionId: transaction.id,
  txHash: 'pending',
  blockchainData: { chain: 'base' }
});
```

### Onchain USDC Deposit Flow

1. User creates deposit intent via `/api/v1/deposit/intent/create`
2. System adds **repeating job** that runs every 30 seconds
3. Worker scans blockchain for USDC Transfer events
4. When found and confirmed (2 blocks), credits portfolio
5. Job automatically stops when:
   - Deposit confirmed, OR
   - Session expires (60 minutes), OR
   - Max attempts reached (120 checks)

**Code:**
```typescript
// In createDepositIntent handler
await ONCHAIN_DEPOSIT_CONFIRMATION_QUEUE.add({
  depositSessionId: session.id,
  userId
}, {
  repeat: { every: 30000, limit: 120 }
});
```

## Job Options Explained

```typescript
{
  // Retry configuration
  attempts: 3,                    // Retry 3 times on failure
  backoff: {
    type: 'exponential',          // Wait longer between retries
    delay: 2000                   // Start with 2s delay (2s, 4s, 8s)
  },

  // Repeating jobs
  repeat: {
    every: 30000,                 // Run every 30 seconds
    limit: 120                    // Max 120 repetitions
  },

  // Deduplication
  jobId: 'unique-session-id',     // Prevents duplicate jobs

  // Cleanup
  removeOnComplete: true,         // Delete after success
  removeOnFail: false             // Keep failed jobs for debugging
}
```

## Monitoring with Bull Board

### Dashboard Features

1. **Queue Overview**
   - Active/waiting/completed/failed counts
   - Processing rate
   - Queue health

2. **Job Inspection**
   - View job data (transaction IDs, amounts, etc.)
   - See all logs from `job.log()` calls
   - View error stack traces

3. **Manual Actions**
   - Retry failed jobs
   - Clean old jobs
   - Pause/resume queues

### Accessing Dashboard

**Development:**
```
http://localhost:3003/admin/queues
```

**Production (IMPORTANT!):**
```typescript
// Add authentication middleware!
app.use('/admin/queues', requireAdmin, serverAdapter.getRouter());
```

## Production Deployment

### Redis Hosting Options

1. **Render** (easiest)
   - Add Redis service (free tier available)
   - Get `REDIS_URL` from dashboard
   - Add to environment variables

2. **Railway**
   - Add Redis plugin
   - Get connection URL
   - Set `REDIS_URL` variable

3. **Upstash** (serverless)
   - Create Redis database
   - Get connection URL
   - Best for AWS Lambda/Vercel

### Running Worker in Production

**Option 1: PM2 (recommended)**
```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start service/jobs/worker.ts --name kiota-worker

# Run 4 workers for high availability
pm2 start service/jobs/worker.ts -i 4 --name kiota-worker

# Auto-restart on server reboot
pm2 startup
pm2 save
```

**Option 2: Docker**
```dockerfile
# Dockerfile.worker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["node", "service/jobs/worker.js"]
```

**Option 3: Render Background Worker**
```yaml
# render.yaml
services:
  - type: worker
    name: kiota-worker
    env: node
    buildCommand: npm install
    startCommand: npm run worker
```

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection:
```bash
redis-cli ping
# Should return: PONG
```

2. Check worker logs:
```bash
pm2 logs kiota-worker
```

3. Verify queue in Bull Board:
- Go to dashboard
- Check "Waiting" count
- If jobs stuck, check worker is running

### Jobs failing repeatedly

1. View error in Bull Board:
- Click failed job
- See error message and stack trace
- Check job logs

2. Common issues:
   - **RPC rate limit** - Reduce concurrency or add delay
   - **Database timeout** - Check DB connection pool
   - **Missing data** - Check job.data structure

### High memory usage

1. Clean up old jobs:
```typescript
// In queue config
removeOnComplete: 100,  // Keep only 100 completed
removeOnFail: 500,      // Keep 500 failed for debugging
```

2. Manually clean via Bull Board or code:
```typescript
await DEPOSIT_COMPLETION_QUEUE.clean(24 * 60 * 60 * 1000); // Clean jobs older than 24h
```

## Best Practices

### 1. Job Idempotency
Always design processors to be idempotent (safe to run multiple times):

```typescript
// ✅ GOOD - Check if already processed
const transaction = await repo.getById(transactionId);
if (transaction.status === 'completed') {
  return; // Already done, skip
}
```

### 2. Logging
Use `job.log()` for debugging (visible in Bull Board):

```typescript
job.log('Processing transaction: ' + transactionId);
job.log('Amount: ' + amount + ' USD');
```

### 3. Error Handling
Let errors bubble up for automatic retry:

```typescript
// ✅ GOOD - Bull handles retry
if (!transaction) {
  throw new Error('Transaction not found');
}

// ❌ BAD - Swallows error, no retry
if (!transaction) {
  console.error('Transaction not found');
  return;
}
```

### 4. Concurrency
Adjust based on your resources:

```typescript
// Heavy blockchain operations
ONCHAIN_QUEUE.process(3, processor);  // Low concurrency

// Lightweight database operations
NOTIFICATION_QUEUE.process(10, processor);  // Higher concurrency
```

### 5. Security
**ALWAYS protect Bull Board in production:**

```typescript
// ❌ DANGEROUS
app.use('/admin/queues', serverAdapter.getRouter());

// ✅ SAFE
app.use('/admin/queues', requireAdmin, serverAdapter.getRouter());
```

## Scaling

### Horizontal Scaling (Multiple Workers)

Run multiple worker processes for high availability:

```bash
# PM2
pm2 start worker.ts -i 4

# Docker Compose
docker-compose up --scale worker=4

# Kubernetes
replicas: 4
```

Bull automatically distributes jobs across all workers.

### Vertical Scaling (Concurrency)

Increase concurrency per worker:

```typescript
// Process more jobs simultaneously
DEPOSIT_COMPLETION_QUEUE.process(10, processor); // Was 5
```

### Queue Prioritization

Add priority to urgent jobs:

```typescript
await DEPOSIT_COMPLETION_QUEUE.add(data, {
  priority: 1  // Higher priority (1 = highest)
});
```

## Metrics and Monitoring

### Key Metrics to Track

1. **Job Duration** - How long jobs take to process
2. **Failure Rate** - % of jobs that fail
3. **Queue Depth** - Number of waiting jobs
4. **Worker Utilization** - Active jobs / total concurrency

### Monitoring Tools

1. **Bull Board** - Built-in, visual
2. **Redis CLI** - Check queue size
```bash
redis-cli
> LLEN bull:deposit-completion:wait
```
3. **PM2 Monitor** - Worker health
```bash
pm2 monit
```

## Support

For issues or questions:
- Check Bull Board dashboard first
- Review worker logs: `pm2 logs kiota-worker`
- Check Redis connection: `redis-cli ping`
- Review this documentation

## References

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Redis Documentation](https://redis.io/documentation)
