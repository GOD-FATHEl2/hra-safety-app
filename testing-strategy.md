# Testing Strategy for HRA Application

## Test Structure Overview

```
tests/
├── unit/
│   ├── auth.test.js
│   ├── assessments.test.js
│   ├── users.test.js
│   └── analytics.test.js
├── integration/
│   ├── api.test.js
│   ├── database.test.js
│   └── sharepoint.test.js
├── e2e/
│   ├── login.spec.js
│   ├── assessment-flow.spec.js
│   └── dashboard.spec.js
├── fixtures/
│   ├── users.json
│   └── assessments.json
└── helpers/
    ├── test-db.js
    └── mock-sharepoint.js
```

## Unit Tests Example

### tests/unit/assessments.test.js
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Import your assessment functions
import { createAssessment, calculateRiskScore, validateChecklist } from '../../server.js';

describe('Assessment Logic', () => {
  let db;
  
  beforeEach(() => {
    // Create in-memory test database
    db = new Database(':memory:');
    
    // Load schema
    const schema = fs.readFileSync(path.join(__dirname, '../../schema.sql'), 'utf8');
    db.exec(schema);
    
    // Seed test data
    const testUser = db.prepare(`
      INSERT INTO users (username, passhash, name, role, active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `);
    testUser.run('testuser', 'hashedpassword', 'Test User', 'underhall');
  });
  
  afterEach(() => {
    db.close();
  });

  it('should calculate risk score correctly', () => {
    expect(calculateRiskScore(3, 4)).toBe(12);
    expect(calculateRiskScore(1, 1)).toBe(1);
    expect(calculateRiskScore(5, 5)).toBe(25);
  });

  it('should validate checklist answers', () => {
    const validChecklist = ['Ja', 'Ja', 'Nej', 'Ja', '', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja'];
    const result = validateChecklist(validChecklist);
    
    expect(result.hasNegativeAnswers).toBe(true);
    expect(result.unansweredCount).toBe(1);
  });

  it('should require leader approval for high risk', () => {
    const highRiskAssessment = {
      risk_s: 5,
      risk_k: 5, // Risk score = 25
      checklist: ['Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja'],
      safe: 'Ja'
    };
    
    const requirements = checkApprovalRequirements(highRiskAssessment);
    expect(requirements.requiresLeader).toBe(true);
  });

  it('should require leader approval for negative checklist answers', () => {
    const assessmentWithNej = {
      risk_s: 2,
      risk_k: 2, // Risk score = 4 (low)
      checklist: ['Ja', 'Nej', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja'],
      safe: 'Ja'
    };
    
    const requirements = checkApprovalRequirements(assessmentWithNej);
    expect(requirements.requiresLeader).toBe(true);
  });
});

function calculateRiskScore(probability, consequence) {
  return probability * consequence;
}

function validateChecklist(checklist) {
  const hasNegativeAnswers = checklist.some(answer => answer === 'Nej');
  const unansweredCount = checklist.filter(answer => answer === '' || answer === null).length;
  
  return {
    hasNegativeAnswers,
    unansweredCount,
    isComplete: unansweredCount === 0
  };
}

function checkApprovalRequirements(assessment) {
  const riskScore = calculateRiskScore(assessment.risk_s, assessment.risk_k);
  const hasNegativeAnswers = assessment.checklist.some(answer => answer === 'Nej');
  const requiresLeader = riskScore >= 10 || hasNegativeAnswers || assessment.safe === 'Nej';
  
  return {
    requiresLeader,
    riskScore,
    hasNegativeAnswers
  };
}
```

## Integration Tests

### tests/integration/api.test.js
```javascript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js'; // Export your Express app
import Database from 'better-sqlite3';

describe('API Integration Tests', () => {
  let db;
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test database
    db = new Database(':memory:');
    // ... setup schema and test data
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(() => {
    db.close();
  });

  describe('POST /api/assessments', () => {
    it('should create a new assessment', async () => {
      const assessmentData = {
        date: '2023-12-01',
        worker_name: 'Test Worker',
        team: 'Test Team',
        location: 'Test Location',
        task: 'Test Task',
        risk_s: 3,
        risk_k: 3,
        risks: 'Test risks',
        checklist: ['Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja'],
        actions: 'Test actions',
        further: 'Nej',
        fullrisk: 'Nej',
        safe: 'Ja',
        leader: 'Test Leader',
        signature: 'TL'
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.riskScore).toBe(9);
    });

    it('should reject assessment without required fields', async () => {
      const incompleteData = {
        date: '2023-12-01'
        // Missing required fields
      };

      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should require leader approval for high risk', async () => {
      const highRiskData = {
        date: '2023-12-01',
        worker_name: 'Test Worker',
        team: 'Test Team',
        location: 'Test Location',
        task: 'High Risk Task',
        risk_s: 5,
        risk_k: 5, // Risk score = 25
        risks: 'High risk work',
        checklist: ['Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja', 'Ja'],
        actions: 'Safety measures',
        further: 'Nej',
        fullrisk: 'Nej',
        safe: 'Ja'
        // Missing leader and signature
      };

      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(highRiskData)
        .expect(400);
    });
  });

  describe('GET /api/assessments', () => {
    it('should return user assessments for underhall role', async () => {
      const response = await request(app)
        .get('/api/assessments?mine=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/assessments/:id/approve', () => {
    it('should require supervisor role or higher', async () => {
      // Create assessment first
      const assessment = await createTestAssessment();
      
      await request(app)
        .post(`/api/assessments/${assessment.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`) // underhall role
        .expect(403);
    });
  });
});
```

## End-to-End Tests (Playwright)

### tests/e2e/assessment-flow.spec.js
```javascript
import { test, expect } from '@playwright/test';

test.describe('Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('#lu', 'testuser');
    await page.fill('#lp', 'testpass');
    await page.click('#loginBtn');
    await expect(page.locator('#nav')).toBeVisible();
  });

  test('should create a complete assessment', async ({ page }) => {
    // Navigate to form
    await page.click('[data-view="form"]');
    await expect(page.locator('#formView')).toBeVisible();

    // Fill basic information
    await page.fill('#f_datum', '2023-12-01');
    await page.fill('#f_namn', 'Test Worker');
    await page.fill('#f_team', 'Maintenance');
    await page.fill('#f_plats', 'Workshop A');
    await page.fill('#f_task', 'Equipment maintenance');

    // Set risk scores
    await page.selectOption('#f_s', '3');
    await page.selectOption('#f_k', '3');

    // Fill risks
    await page.fill('#f_risks', 'Electrical hazards, moving parts');

    // Answer checklist
    for (let i = 0; i < 10; i++) {
      await page.selectOption(`#q${i}`, 'Ja');
    }

    // Fill actions
    await page.fill('#f_actions', 'LOTO procedure, safety barriers');

    // Submit form
    await page.click('#f_submit');

    // Verify success message
    await expect(page.locator('#f_msg.ok')).toBeVisible();
    await expect(page.locator('#f_msg')).toContainText('Skickad');
  });

  test('should show warning for negative checklist answers', async ({ page }) => {
    await page.click('[data-view="form"]');
    
    // Fill required fields
    await page.fill('#f_datum', '2023-12-01');
    await page.fill('#f_namn', 'Test Worker');
    await page.fill('#f_task', 'Risky task');

    // Answer "Nej" to first question
    await page.selectOption('#q0', 'Nej');

    // Verify warning appears
    await expect(page.locator('#f_warn')).toBeVisible();
    await expect(page.locator('#f_warn')).toContainText('arbetsledarens godkännande');
  });

  test('should require leader approval for high risk assessment', async ({ page }) => {
    await page.click('[data-view="form"]');
    
    // Fill basic info
    await page.fill('#f_datum', '2023-12-01');
    await page.fill('#f_namn', 'Test Worker');
    await page.fill('#f_task', 'High risk task');

    // Set high risk scores
    await page.selectOption('#f_s', '5');
    await page.selectOption('#f_k', '5');

    // Answer all checklist questions as "Ja"
    for (let i = 0; i < 10; i++) {
      await page.selectOption(`#q${i}`, 'Ja');
    }

    // Try to submit without leader info
    await page.click('#f_submit');

    // Should show error
    await expect(page.locator('#f_msg.warn')).toBeVisible();
    await expect(page.locator('#f_msg')).toContainText('Kräver arbetsledarens');
  });
});

test.describe('Dashboard', () => {
  test('should show statistics for supervisors', async ({ page }) => {
    // Login as supervisor
    await page.goto('/');
    await page.fill('#lu', 'supervisor');
    await page.fill('#lp', 'supervisorpass');
    await page.click('#loginBtn');

    // Navigate to dashboard
    await page.click('[data-view="dash"]');
    await expect(page.locator('#dashView')).toBeVisible();

    // Check statistics
    await expect(page.locator('#stats')).toBeVisible();
    await expect(page.locator('#stats')).toContainText('Totalt:');
    await expect(page.locator('#stats')).toContainText('Öppna:');
    await expect(page.locator('#stats')).toContainText('Låg:');
  });

  test('should allow approving assessments', async ({ page }) => {
    // Login as supervisor and navigate to dashboard
    await page.goto('/');
    await page.fill('#lu', 'supervisor');
    await page.fill('#lp', 'supervisorpass');
    await page.click('#loginBtn');
    await page.click('[data-view="dash"]');

    // Look for approve button and click it
    const approveButton = page.locator('[data-approve]').first();
    if (await approveButton.isVisible()) {
      await approveButton.click();
      
      // Verify the assessment status changed
      await page.waitForTimeout(1000); // Wait for update
      await expect(page.locator('text=Approved')).toBeVisible();
    }
  });
});
```

## Test Configuration

### vitest.config.js
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        '*.config.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### playwright.config.js
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Scripts in package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```