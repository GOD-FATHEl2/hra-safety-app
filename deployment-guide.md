# DevOps and Deployment Strategy

## Docker Setup

### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application (if using React build)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001

# Copy production dependencies
COPY --from=builder --chown=node:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=node:nodejs /app/package*.json ./
COPY --from=builder --chown=node:nodejs /app/server.js ./
COPY --from=builder --chown=node:nodejs /app/client ./client/

# Create data directory for SQLite
RUN mkdir -p /app/data && chown node:nodejs /app/data

USER node

EXPOSE 8080

ENV NODE_ENV=production
ENV DB_PATH=/app/data/hogrisk.db

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### Docker Compose for Development
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - TENANT_ID=${TENANT_ID}
      - CLIENT_ID=${CLIENT_ID}
      - CLIENT_SECRET=${CLIENT_SECRET}
      - SPO_HOSTNAME=${SPO_HOSTNAME}
      - SPO_SITE_PATH=${SPO_SITE_PATH}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
```

## GitHub Actions CI/CD

### .github/workflows/ci-cd.yml
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Run security audit
      run: npm audit --audit-level=high

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploy to production server"
        # Add your deployment commands here
```

## Monitoring and Observability

### Health Check Endpoint
```javascript
// Add to server.js
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // Check DB connection
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  try {
    // Test database connection
    db.prepare('SELECT 1').get();
    res.status(200).json(health);
  } catch (error) {
    health.status = 'error';
    health.database = 'disconnected';
    health.error = error.message;
    res.status(503).json(health);
  }
});

app.get('/metrics', (req, res) => {
  // Prometheus metrics endpoint
  const metrics = `
# HELP hra_assessments_total Total number of assessments
# TYPE hra_assessments_total counter
hra_assessments_total ${db.prepare('SELECT COUNT(*) as count FROM assessments').get().count}

# HELP hra_users_total Total number of users
# TYPE hra_users_total counter
hra_users_total ${db.prepare('SELECT COUNT(*) as count FROM users WHERE active=1').get().count}

# HELP hra_high_risk_assessments_total Total number of high risk assessments
# TYPE hra_high_risk_assessments_total counter
hra_high_risk_assessments_total ${db.prepare('SELECT COUNT(*) as count FROM assessments WHERE risk_score >= 10').get().count}
  `;
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
```

## Environment Configuration

### Production .env template
```bash
# Application
NODE_ENV=production
PORT=8080
DB_PATH=/app/data/hogrisk.db

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here

# Microsoft Graph API
TENANT_ID=your-tenant-id
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret

# SharePoint
SPO_HOSTNAME=your-sharepoint-hostname
SPO_SITE_PATH=sites/your-site
SPO_DRIVE_NAME=Shared Documents
SPO_FOLDER_PATH=Hogrisk/PDF

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Backup Strategy

### Database Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/app/backups"
DB_PATH="/app/data/hogrisk.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hogrisk_backup_$DATE.db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
sqlite3 $DB_PATH ".backup $BACKUP_FILE"

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

## SSL/TLS Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://app:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```