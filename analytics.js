// Advanced Analytics Module
// File: analytics.js

import Database from 'better-sqlite3';

export class AnalyticsService {
  constructor(db) {
    this.db = db;
    this.initializeAnalyticsTables();
  }

  initializeAnalyticsTables() {
    // Analytics tables for advanced reporting
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_data TEXT, -- JSON
        user_id INTEGER REFERENCES users(id),
        assessment_id INTEGER REFERENCES assessments(id),
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT
      );

      CREATE TABLE IF NOT EXISTS risk_trends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        location TEXT,
        team TEXT,
        avg_risk_score REAL,
        total_assessments INTEGER,
        high_risk_count INTEGER,
        incidents_prevented INTEGER DEFAULT 0,
        calculated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS safety_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        location TEXT,
        team TEXT,
        calculated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_risk_trends_date ON risk_trends(date);
      CREATE INDEX IF NOT EXISTS idx_safety_metrics_name ON safety_metrics(metric_name);
    `);
  }

  // Track user interactions
  logEvent(eventType, eventData, userId, assessmentId = null, sessionId = null, ipAddress = null, userAgent = null) {
    this.db.prepare(`
      INSERT INTO analytics_events (event_type, event_data, user_id, assessment_id, session_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(eventType, JSON.stringify(eventData), userId, assessmentId, sessionId, ipAddress, userAgent);
  }

  // Generate comprehensive dashboard analytics
  getDashboardAnalytics(dateRange = 30) {
    const since = new Date();
    since.setDate(since.getDate() - dateRange);
    const sinceISO = since.toISOString();

    // Basic statistics
    const basicStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_assessments,
        AVG(risk_score) as avg_risk_score,
        COUNT(CASE WHEN risk_score >= 10 THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as pending_approvals,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN requires_leader = 1 AND leader_provided = 0 THEN 1 END) as missing_approvals
      FROM assessments 
      WHERE created_at >= ?
    `).get(sinceISO);

    // Risk distribution by location
    const locationRisks = this.db.prepare(`
      SELECT 
        location,
        COUNT(*) as assessment_count,
        AVG(risk_score) as avg_risk,
        COUNT(CASE WHEN risk_score >= 10 THEN 1 END) as high_risk_count
      FROM assessments 
      WHERE created_at >= ? AND location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY avg_risk DESC
    `).all(sinceISO);

    // Daily trend
    const dailyTrend = this.db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as assessments,
        AVG(risk_score) as avg_risk,
        COUNT(CASE WHEN risk_score >= 10 THEN 1 END) as high_risk
      FROM assessments 
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(sinceISO);

    // Most common risks (from checklist "Nej" answers)
    const commonRisks = this.db.prepare(`
      SELECT * FROM assessments 
      WHERE created_at >= ? AND checklist IS NOT NULL
    `).all(sinceISO);

    const riskQuestions = [
      "Risker/resternergier bedömda (Safety Placard som stöd)?",
      "Fallrisker eliminerade?",
      "Kläm-/skär-/kraftrisker hanterade?",
      "Rätt verktyg/PPE tillgängligt?",
      "Tillstånd/behörighet (heta arbeten/slutna utrymmen) klart?",
      "Snubbel/olja/lösa föremål undanröjda?",
      "Avspärrningar/kommunikation/skyltning klar?",
      "Utrustning i gott skick för lyft/lastsäkring?",
      "Nödvändig utrustning kontrollerad före användning?",
      "Känt var nödstopp/utrymning/ögondusch finns?"
    ];

    const riskCounts = riskQuestions.map((question, index) => {
      const count = commonRisks.reduce((acc, assessment) => {
        try {
          const checklist = JSON.parse(assessment.checklist || '[]');
          return acc + (checklist[index] === 'Nej' ? 1 : 0);
        } catch {
          return acc;
        }
      }, 0);
      return { question, index, nejCount: count };
    }).sort((a, b) => b.nejCount - a.nejCount);

    // Team performance
    const teamStats = this.db.prepare(`
      SELECT 
        team,
        COUNT(*) as assessment_count,
        AVG(risk_score) as avg_risk,
        COUNT(CASE WHEN risk_score >= 10 THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count
      FROM assessments 
      WHERE created_at >= ? AND team IS NOT NULL AND team != ''
      GROUP BY team
      ORDER BY assessment_count DESC
    `).all(sinceISO);

    // Approval time statistics
    const approvalTimes = this.db.prepare(`
      SELECT 
        AVG(julianday(approved_at) - julianday(created_at)) * 24 as avg_hours_to_approval,
        MIN(julianday(approved_at) - julianday(created_at)) * 24 as min_hours_to_approval,
        MAX(julianday(approved_at) - julianday(created_at)) * 24 as max_hours_to_approval
      FROM assessments 
      WHERE created_at >= ? AND approved_at IS NOT NULL
    `).get(sinceISO);

    return {
      basicStats,
      locationRisks,
      dailyTrend,
      commonRisks: riskCounts,
      teamStats,
      approvalTimes,
      generatedAt: new Date().toISOString()
    };
  }

  // Predictive risk analysis
  getPredictiveRiskAnalysis() {
    // Analyze patterns in high-risk assessments
    const highRiskPatterns = this.db.prepare(`
      SELECT 
        location,
        team,
        COUNT(*) as high_risk_count,
        AVG(risk_score) as avg_risk_score,
        GROUP_CONCAT(DISTINCT task) as common_tasks
      FROM assessments 
      WHERE risk_score >= 10
      GROUP BY location, team
      HAVING COUNT(*) >= 3
      ORDER BY high_risk_count DESC
    `).all();

    // Time-based risk patterns
    const timePatterns = this.db.prepare(`
      SELECT 
        strftime('%H', created_at) as hour_of_day,
        strftime('%w', created_at) as day_of_week,
        COUNT(*) as assessment_count,
        AVG(risk_score) as avg_risk_score,
        COUNT(CASE WHEN risk_score >= 10 THEN 1 END) as high_risk_count
      FROM assessments 
      WHERE created_at >= datetime('now', '-90 days')
      GROUP BY hour_of_day, day_of_week
      HAVING COUNT(*) >= 5
      ORDER BY avg_risk_score DESC
    `).all();

    // Seasonal trends
    const seasonalTrends = this.db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as assessment_count,
        AVG(risk_score) as avg_risk_score,
        COUNT(CASE WHEN risk_score >= 10 THEN 1 END) as high_risk_count
      FROM assessments 
      WHERE created_at >= datetime('now', '-12 months')
      GROUP BY month
      ORDER BY month DESC
    `).all();

    return {
      highRiskPatterns,
      timePatterns,
      seasonalTrends,
      recommendations: this.generateRecommendations(highRiskPatterns, timePatterns)
    };
  }

  generateRecommendations(highRiskPatterns, timePatterns) {
    const recommendations = [];

    // Location-based recommendations
    highRiskPatterns.forEach(pattern => {
      if (pattern.high_risk_count >= 5) {
        recommendations.push({
          type: 'location_risk',
          priority: 'high',
          title: `Hög risk identifierad: ${pattern.location}`,
          description: `${pattern.location} har ${pattern.high_risk_count} högriskbedömningar. Genomsnittlig riskpoäng: ${pattern.avg_risk_score.toFixed(1)}`,
          action: 'Överväg ytterligare säkerhetsåtgärder och utbildning för denna plats.'
        });
      }
    });

    // Time-based recommendations
    const highRiskHours = timePatterns.filter(p => p.avg_risk_score >= 8);
    if (highRiskHours.length > 0) {
      recommendations.push({
        type: 'time_risk',
        priority: 'medium',
        title: 'Riskfyllda tidpunkter identifierade',
        description: `Höga riskpoäng observerade under specifika timmar/dagar`,
        action: 'Överväg förstärkt övervakning under dessa tider.'
      });
    }

    return recommendations;
  }

  // Export data for external analysis
  exportDataForAnalysis(format = 'json', dateRange = 90) {
    const since = new Date();
    since.setDate(since.getDate() - dateRange);
    const sinceISO = since.toISOString();

    const data = this.db.prepare(`
      SELECT 
        a.*,
        u.name as created_by_name,
        u.role as created_by_role
      FROM assessments a
      JOIN users u ON a.created_by = u.id
      WHERE a.created_at >= ?
      ORDER BY a.created_at DESC
    `).all(sinceISO);

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  convertToCSV(data) {
    if (!data.length) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  // Calculate safety KPIs
  calculateSafetyKPIs(period = 'monthly') {
    const kpis = {};

    // Assessment completion rate
    const completionRate = this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN status IN ('Approved', 'Submitted') THEN 1 END) * 100.0 / COUNT(*) as completion_rate
      FROM assessments 
      WHERE created_at >= datetime('now', '-30 days')
    `).get();

    // Average time to approval
    const approvalTime = this.db.prepare(`
      SELECT AVG(julianday(approved_at) - julianday(created_at)) * 24 as avg_hours
      FROM assessments 
      WHERE approved_at IS NOT NULL AND created_at >= datetime('now', '-30 days')
    `).get();

    // Risk score trends
    const riskTrend = this.db.prepare(`
      SELECT 
        AVG(risk_score) as current_avg,
        (SELECT AVG(risk_score) FROM assessments WHERE created_at BETWEEN datetime('now', '-60 days') AND datetime('now', '-30 days')) as previous_avg
      FROM assessments 
      WHERE created_at >= datetime('now', '-30 days')
    `).get();

    kpis.completionRate = completionRate.completion_rate;
    kpis.avgApprovalTime = approvalTime.avg_hours;
    kpis.riskScoreTrend = {
      current: riskTrend.current_avg,
      previous: riskTrend.previous_avg,
      change: riskTrend.current_avg - riskTrend.previous_avg
    };

    return kpis;
  }
}