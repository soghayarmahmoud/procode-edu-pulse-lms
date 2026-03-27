// ============================================
// ProCode EduPulse — Analytics Dashboard Component
// ============================================

import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js/+esm';
import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { firestoreService } from '../services/firestore-service.js';

Chart.register(...registerables);

export class AnalyticsComponent {
  constructor() {
    this.charts = {};
    this.currentPeriod = '30d';
    this.userData = null;
    this.init();
  }

  async init() {
    this.userData = await this.getUserData();
    this.setupEventListeners();
    await this.renderDashboard();
  }

  setupEventListeners() {
    // Period selector buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentPeriod = e.target.dataset.period;
        this.renderDashboard();
      });
    });
  }

  async getUserData() {
    // Try to get from Firebase first, fallback to localStorage
    try {
      if (window.auth?.currentUser) {
        const userDoc = await firestoreService.getUserProgress(window.auth.currentUser.uid);
        return userDoc;
      }
    } catch (error) {
      console.warn('Firebase not available, using localStorage');
    }

    return storage.getUserProgress() || {
      totalXP: 0,
      completedLessons: [],
      completedChallenges: [],
      courseProgress: {},
      achievements: [],
      learningStreak: 0,
      lastActiveDate: null,
      weeklyActivity: {},
      skillProgress: {}
    };
  }

  async renderDashboard() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = `
      <div class="analytics-dashboard">
        <div class="analytics-header">
          <h1 class="analytics-title">Learning Analytics</h1>
          <div class="analytics-period-selector">
            <button class="period-btn" data-period="7d">7 Days</button>
            <button class="period-btn active" data-period="30d">30 Days</button>
            <button class="period-btn" data-period="90d">90 Days</button>
            <button class="period-btn" data-period="all">All Time</button>
          </div>
        </div>

        <div class="stats-grid">
          ${this.renderStatsCards()}
        </div>

        <div class="charts-section">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Learning Activity</h3>
            </div>
            <div class="chart-container">
              <canvas id="activity-chart"></canvas>
            </div>
          </div>
          
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Skill Progress</h3>
            </div>
            <div class="chart-container">
              <canvas id="skills-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="chart-card full-width">
          <div class="chart-header">
            <h3 class="chart-title">XP & Progress Trends</h3>
          </div>
          <div class="chart-container">
            <canvas id="progress-chart"></canvas>
          </div>
        </div>

        <div class="progress-section">
          <h3 class="section-title">Course Progress</h3>
          <div class="course-progress-list">
            ${this.renderCourseProgress()}
          </div>
        </div>

        <div class="achievements-section">
          <h3 class="section-title">Recent Achievements</h3>
          <div class="achievements-grid">
            ${this.renderAchievements()}
          </div>
        </div>

        <div class="streak-calendar">
          <h3 class="section-title">Learning Streak Calendar</h3>
          <div class="calendar-grid">
            ${this.renderStreakCalendar()}
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.initializeCharts();
  }

  renderStatsCards() {
    const stats = this.calculateStats();
    
    return `
      <div class="stat-card">
        <div class="stat-header">
          <div>
            <div class="stat-value">${stats.totalXP.toLocaleString()}</div>
            <div class="stat-label">Total XP Earned</div>
            <div class="stat-change ${stats.xpChange >= 0 ? 'positive' : 'negative'}">
              <i class="fa-solid fa-${stats.xpChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
              ${Math.abs(stats.xpChange)}% this period
            </div>
          </div>
          <div class="stat-icon primary">
            <i class="fa-solid fa-trophy"></i>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div>
            <div class="stat-value">${stats.completedLessons}</div>
            <div class="stat-label">Lessons Completed</div>
            <div class="stat-change ${stats.lessonChange >= 0 ? 'positive' : 'negative'}">
              <i class="fa-solid fa-${stats.lessonChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
              ${Math.abs(stats.lessonChange)} this period
            </div>
          </div>
          <div class="stat-icon success">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div>
            <div class="stat-value">${stats.completedChallenges}</div>
            <div class="stat-label">Challenges Solved</div>
            <div class="stat-change ${stats.challengeChange >= 0 ? 'positive' : 'negative'}">
              <i class="fa-solid fa-${stats.challengeChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
              ${Math.abs(stats.challengeChange)} this period
            </div>
          </div>
          <div class="stat-icon warning">
            <i class="fa-solid fa-code"></i>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div>
            <div class="stat-value">${stats.currentStreak}</div>
            <div class="stat-label">Day Streak 🔥</div>
            <div class="stat-change ${stats.streakChange >= 0 ? 'positive' : 'negative'}">
              <i class="fa-solid fa-${stats.streakChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
              ${Math.abs(stats.streakChange)} this period
            </div>
          </div>
          <div class="stat-icon info">
            <i class="fa-solid fa-fire"></i>
          </div>
        </div>
      </div>
    `;
  }

  calculateStats() {
    const period = this.getPeriodDays();
    const now = new Date();
    const periodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    
    // Calculate current period stats
    const currentPeriodData = this.filterDataByPeriod(this.userData, periodStart);
    const previousPeriodStart = new Date(periodStart.getTime() - period * 24 * 60 * 60 * 1000);
    const previousPeriodData = this.filterDataByPeriod(this.userData, previousPeriodStart, periodStart);
    
    return {
      totalXP: this.userData.totalXP || 0,
      completedLessons: (this.userData.completedLessons || []).length,
      completedChallenges: (this.userData.completedChallenges || []).length,
      currentStreak: this.userData.learningStreak || 0,
      xpChange: this.calculatePercentageChange(currentPeriodData.xp, previousPeriodData.xp),
      lessonChange: this.calculatePercentageChange(currentPeriodData.lessons, previousPeriodData.lessons),
      challengeChange: this.calculatePercentageChange(currentPeriodData.challenges, previousPeriodData.challenges),
      streakChange: this.calculatePercentageChange(currentPeriodData.streak, previousPeriodData.streak)
    };
  }

  getPeriodDays() {
    const periods = { '7d': 7, '30d': 30, '90d': 90, 'all': 365 };
    return periods[this.currentPeriod] || 30;
  }

  filterDataByPeriod(data, startDate, endDate = new Date()) {
    // This would filter actual data based on timestamps
    // For now, return mock data
    return {
      xp: Math.floor(Math.random() * 1000),
      lessons: Math.floor(Math.random() * 20),
      challenges: Math.floor(Math.random() * 30),
      streak: Math.floor(Math.random() * 10)
    };
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  renderCourseProgress() {
    const courses = this.userData.courseProgress || {};
    
    return Object.entries(courses).map(([courseId, progress], index) => {
      const courseName = this.getCourseName(courseId);
      const completedLessons = progress.completedLessons || 0;
      const totalLessons = progress.totalLessons || 10;
      const percentage = Math.round((completedLessons / totalLessons) * 100);
      
      return `
        <div class="course-progress-item">
          <div class="course-progress-icon">${index + 1}</div>
          <div class="course-progress-details">
            <div class="course-progress-name">${courseName}</div>
            <div class="course-progress-meta">
              <span>${completedLessons}/${totalLessons} lessons</span>
              <span>•</span>
              <span>${progress.xp || 0} XP</span>
            </div>
          </div>
          <div class="course-progress-bar">
            <div class="course-progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="course-progress-percentage">${percentage}%</div>
        </div>
      `;
    }).join('');
  }

  getCourseName(courseId) {
    const courseNames = {
      'html-basics': 'HTML Basics',
      'css-fundamentals': 'CSS Fundamentals',
      'javascript-core': 'JavaScript Core',
      'linux-essentials': 'Linux Essentials',
      'cpp-programming': 'C++ Programming'
    };
    return courseNames[courseId] || 'Unknown Course';
  }

  renderAchievements() {
    const achievements = this.userData.achievements || [];
    const allAchievements = this.getAllAchievements();
    
    return allAchievements.map(achievement => {
      const isUnlocked = achievements.includes(achievement.id);
      return `
        <div class="achievement-badge ${isUnlocked ? 'unlocked' : ''}">
          <div class="achievement-icon">
            <i class="${isUnlocked ? achievement.icon : 'fa-solid fa-lock'}"></i>
          </div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-tooltip">${achievement.description}</div>
        </div>
      `;
    }).join('');
  }

  getAllAchievements() {
    return [
      { id: 'first-lesson', name: 'First Steps', icon: 'fa-solid fa-baby', description: 'Complete your first lesson' },
      { id: 'week-streak', name: 'Week Warrior', icon: 'fa-solid fa-fire', description: '7-day learning streak' },
      { id: 'code-master', name: 'Code Master', icon: 'fa-solid fa-code', description: 'Solve 50 challenges' },
      { id: 'xp-collector', name: 'XP Collector', icon: 'fa-solid fa-coins', description: 'Earn 1000 XP' },
      { id: 'course-complete', name: 'Course Graduate', icon: 'fa-solid fa-graduation-cap', description: 'Complete a full course' },
      { id: 'speed-learner', name: 'Speed Learner', icon: 'fa-solid fa-bolt', description: 'Complete 5 lessons in one day' },
      { id: 'night-owl', name: 'Night Owl', icon: 'fa-solid fa-moon', description: 'Study after midnight' },
      { id: 'early-bird', name: 'Early Bird', icon: 'fa-solid fa-sun', description: 'Study before 6 AM' }
    ];
  }

  renderStreakCalendar() {
    const days = [];
    const today = new Date();
    
    // Generate last 35 days (5 weeks)
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const hasActivity = Math.random() > 0.3; // Mock activity data
      const isToday = i === 0;
      
      days.push(`
        <div class="calendar-day ${hasActivity ? 'has-activity' : ''} ${isToday ? 'today' : ''}">
          ${date.getDate()}
        </div>
      `);
    }
    
    return days.join('');
  }

  initializeCharts() {
    this.renderActivityChart();
    this.renderSkillsChart();
    this.renderProgressChart();
  }

  renderActivityChart() {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;

    const data = this.generateActivityData();
    
    this.charts.activity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Lessons',
          data: data.lessons,
          backgroundColor: 'rgba(0, 120, 212, 0.6)',
          borderColor: 'rgba(0, 120, 212, 1)',
          borderWidth: 1
        }, {
          label: 'Challenges',
          data: data.challenges,
          backgroundColor: 'rgba(0, 188, 242, 0.6)',
          borderColor: 'rgba(0, 188, 242, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
            grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle') }
          },
          x: {
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
            grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle') }
          }
        }
      }
    });
  }

  renderSkillsChart() {
    const ctx = document.getElementById('skills-chart');
    if (!ctx) return;

    const data = this.generateSkillsData();
    
    this.charts.skills = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Current Level',
          data: data.values,
          backgroundColor: 'rgba(0, 120, 212, 0.2)',
          borderColor: 'rgba(0, 120, 212, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(0, 120, 212, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(0, 120, 212, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
            grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle') },
            pointLabels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') }
          }
        }
      }
    });
  }

  renderProgressChart() {
    const ctx = document.getElementById('progress-chart');
    if (!ctx) return;

    const data = this.generateProgressData();
    
    this.charts.progress = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Total XP',
          data: data.xp,
          borderColor: 'rgba(0, 120, 212, 1)',
          backgroundColor: 'rgba(0, 120, 212, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }, {
          label: 'Learning Streak',
          data: data.streak,
          borderColor: 'rgba(255, 107, 107, 1)',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'XP',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
            },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
            grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle') }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Streak Days',
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
            },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
            grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle') }
          }
        }
      }
    });
  }

  generateActivityData() {
    const days = this.getPeriodDays();
    const labels = [];
    const lessons = [];
    const challenges = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      lessons.push(Math.floor(Math.random() * 5));
      challenges.push(Math.floor(Math.random() * 8));
    }
    
    return { labels, lessons, challenges };
  }

  generateSkillsData() {
    return {
      labels: ['HTML', 'CSS', 'JavaScript', 'Linux', 'C++', 'Problem Solving'],
      values: [
        Math.floor(Math.random() * 40) + 60,
        Math.floor(Math.random() * 30) + 50,
        Math.floor(Math.random() * 50) + 40,
        Math.floor(Math.random() * 60) + 20,
        Math.floor(Math.random() * 70) + 10,
        Math.floor(Math.random() * 40) + 50
      ]
    };
  }

  generateProgressData() {
    const days = this.getPeriodDays();
    const labels = [];
    const xp = [];
    const streak = [];
    let currentXP = 0;
    let currentStreak = 0;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      
      currentXP += Math.floor(Math.random() * 100) + 20;
      xp.push(currentXP);
      
      if (Math.random() > 0.2) {
        currentStreak++;
      } else {
        currentStreak = Math.max(0, currentStreak - 1);
      }
      streak.push(currentStreak);
    }
    
    return { labels, xp, streak };
  }

  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
  }
}

// Export for use in router
export function renderAnalytics() {
  const analytics = new AnalyticsComponent();
  return analytics.init();
}
