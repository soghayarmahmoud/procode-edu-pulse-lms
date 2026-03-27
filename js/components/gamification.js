// ============================================
// ProCode EduPulse — Gamification System
// ============================================

import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { authService } from '../services/auth-service.js';

export class GamificationComponent {
  constructor() {
    this.currentUser = authService.getCurrentUser();
    this.userProgress = null;
    this.achievements = this.getAllAchievements();
    this.leaderboard = [];
    this.init();
  }

  async init() {
    await this.loadUserProgress();
    await this.loadLeaderboard();
    this.render();
    this.setupEventListeners();
  }

  async loadUserProgress() {
    try {
      this.userProgress = storage.getUserProgress() || {
        totalXP: 0,
        level: 1,
        achievements: [],
        currentStreak: 0,
        longestStreak: 0,
        gems: 0,
        badges: [],
        completedLessons: [],
        completedChallenges: [],
        skillPoints: {
          html: 0,
          css: 0,
          javascript: 0,
          linux: 0,
          cpp: 0
        },
        statistics: {
          totalStudyTime: 0,
          averageSessionTime: 0,
          favoriteTimeOfDay: 'morning',
          learningSpeed: 'normal'
        }
      };
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  }

  async loadLeaderboard() {
    // Mock leaderboard data
    this.leaderboard = [
      { rank: 1, name: 'Alex Chen', xp: 15420, level: 42, avatar: 'AC', badges: 15, streak: 127 },
      { rank: 2, name: 'Sarah Kim', xp: 14280, level: 38, avatar: 'SK', badges: 12, streak: 89 },
      { rank: 3, name: 'Mike Johnson', xp: 13150, level: 35, avatar: 'MJ', badges: 11, streak: 45 },
      { rank: 4, name: 'Emma Davis', xp: 12600, level: 33, avatar: 'ED', badges: 10, streak: 67 },
      { rank: 5, name: 'You', xp: this.userProgress.totalXP, level: this.userProgress.level, avatar: 'ME', badges: this.userProgress.badges.length, streak: this.userProgress.currentStreak, isCurrentUser: true },
      { rank: 6, name: 'Tom Wilson', xp: 11200, level: 30, avatar: 'TW', badges: 9, streak: 23 },
      { rank: 7, name: 'Lisa Anderson', xp: 10500, level: 28, avatar: 'LA', badges: 8, streak: 34 },
      { rank: 8, name: 'James Brown', xp: 9800, level: 26, avatar: 'JB', badges: 7, streak: 12 }
    ];
  }

  getAllAchievements() {
    return [
      {
        id: 'first-lesson',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: 'fa-solid fa-baby',
        category: 'milestone',
        xpReward: 50,
        gemReward: 5,
        rarity: 'common',
        unlocked: this.userProgress.achievements.includes('first-lesson')
      },
      {
        id: 'week-streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: 'fa-solid fa-fire',
        category: 'streak',
        xpReward: 200,
        gemReward: 20,
        rarity: 'rare',
        unlocked: this.userProgress.achievements.includes('week-streak')
      },
      {
        id: 'month-streak',
        name: 'Monthly Master',
        description: 'Maintain a 30-day learning streak',
        icon: 'fa-solid fa-calendar-check',
        category: 'streak',
        xpReward: 500,
        gemReward: 50,
        rarity: 'epic',
        unlocked: this.userProgress.achievements.includes('month-streak')
      },
      {
        id: 'code-master',
        name: 'Code Master',
        description: 'Complete 50 coding challenges',
        icon: 'fa-solid fa-code',
        category: 'challenge',
        xpReward: 300,
        gemReward: 30,
        rarity: 'rare',
        unlocked: this.userProgress.achievements.includes('code-master')
      },
      {
        id: 'xp-collector',
        name: 'XP Collector',
        description: 'Earn 1000 total XP',
        icon: 'fa-solid fa-coins',
        category: 'milestone',
        xpReward: 100,
        gemReward: 10,
        rarity: 'common',
        unlocked: this.userProgress.achievements.includes('xp-collector')
      },
      {
        id: 'course-complete',
        name: 'Course Graduate',
        description: 'Complete a full course',
        icon: 'fa-solid fa-graduation-cap',
        category: 'course',
        xpReward: 400,
        gemReward: 40,
        rarity: 'rare',
        unlocked: this.userProgress.achievements.includes('course-complete')
      },
      {
        id: 'speed-learner',
        name: 'Speed Learner',
        description: 'Complete 5 lessons in one day',
        icon: 'fa-solid fa-bolt',
        category: 'speed',
        xpReward: 150,
        gemReward: 15,
        rarity: 'uncommon',
        unlocked: this.userProgress.achievements.includes('speed-learner')
      },
      {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Study after midnight for 7 days',
        icon: 'fa-solid fa-moon',
        category: 'time',
        xpReward: 100,
        gemReward: 10,
        rarity: 'uncommon',
        unlocked: this.userProgress.achievements.includes('night-owl')
      },
      {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Study before 6 AM for 7 days',
        icon: 'fa-solid fa-sun',
        category: 'time',
        xpReward: 100,
        gemReward: 10,
        rarity: 'uncommon',
        unlocked: this.userProgress.achievements.includes('early-bird')
      },
      {
        id: 'collaborator',
        name: 'Team Player',
        description: 'Participate in 10 collaborative sessions',
        icon: 'fa-solid fa-users',
        category: 'social',
        xpReward: 250,
        gemReward: 25,
        rarity: 'rare',
        unlocked: this.userProgress.achievements.includes('collaborator')
      },
      {
        id: 'helper',
        name: 'Mentor',
        description: 'Help 5 other learners',
        icon: 'fa-solid fa-hands-helping',
        category: 'social',
        xpReward: 200,
        gemReward: 20,
        rarity: 'uncommon',
        unlocked: this.userProgress.achievements.includes('helper')
      },
      {
        id: 'perfect-score',
        name: 'Perfectionist',
        description: 'Get 100% on 10 challenges',
        icon: 'fa-solid fa-star',
        category: 'challenge',
        xpReward: 350,
        gemReward: 35,
        rarity: 'epic',
        unlocked: this.userProgress.achievements.includes('perfect-score')
      }
    ];
  }

  render() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = `
      <div class="gamification-page">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">Achievements & Progress</h1>
            <p class="page-description">Track your learning journey and compete with others</p>
          </div>

          <div class="user-stats-overview">
            <div class="stats-card level-card">
              <div class="stats-icon">
                <i class="fa-solid fa-trophy"></i>
              </div>
              <div class="stats-content">
                <h3>Level ${this.userProgress.level}</h3>
                <div class="xp-progress">
                  <div class="xp-bar">
                    <div class="xp-fill" style="width: ${this.getXPProgress()}%"></div>
                  </div>
                  <span class="xp-text">${this.userProgress.totalXP} / ${this.getXPForNextLevel()} XP</span>
                </div>
              </div>
            </div>

            <div class="stats-card streak-card">
              <div class="stats-icon">
                <i class="fa-solid fa-fire"></i>
              </div>
              <div class="stats-content">
                <h3>${this.userProgress.currentStreak} Day Streak</h3>
                <p>Longest: ${this.userProgress.longestStreak} days</p>
              </div>
            </div>

            <div class="stats-card gems-card">
              <div class="stats-icon">
                <i class="fa-solid fa-gem"></i>
              </div>
              <div class="stats-content">
                <h3>${this.userProgress.gems} Gems</h3>
                <p>Earn rewards and unlock content</p>
              </div>
            </div>

            <div class="stats-card badges-card">
              <div class="stats-icon">
                <i class="fa-solid fa-medal"></i>
              </div>
              <div class="stats-content">
                <h3>${this.userProgress.badges.length} Badges</h3>
                <p>${this.achievements.filter(a => a.unlocked).length} achievements unlocked</p>
              </div>
            </div>
          </div>

          <div class="gamification-tabs">
            <button class="tab-btn active" data-tab="achievements">Achievements</button>
            <button class="tab-btn" data-tab="leaderboard">Leaderboard</button>
            <button class="tab-btn" data-tab="rewards">Rewards</button>
            <button class="tab-btn" data-tab="challenges">Daily Challenges</button>
          </div>

          <div class="tab-content active" id="achievements-tab">
            <div class="achievements-section">
              <div class="achievements-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="milestone">Milestones</button>
                <button class="filter-btn" data-filter="streak">Streaks</button>
                <button class="filter-btn" data-filter="challenge">Challenges</button>
                <button class="filter-btn" data-filter="social">Social</button>
              </div>
              
              <div class="achievements-grid">
                ${this.renderAchievements()}
              </div>
            </div>
          </div>

          <div class="tab-content" id="leaderboard-tab">
            <div class="leaderboard-section">
              <div class="leaderboard-filters">
                <select class="time-filter">
                  <option value="all-time">All Time</option>
                  <option value="monthly">This Month</option>
                  <option value="weekly">This Week</option>
                </select>
                <select class="category-filter">
                  <option value="xp">Total XP</option>
                  <option value="streak">Longest Streak</option>
                  <option value="badges">Most Badges</option>
                </select>
              </div>
              
              <div class="leaderboard-list">
                ${this.renderLeaderboard()}
              </div>
            </div>
          </div>

          <div class="tab-content" id="rewards-tab">
            <div class="rewards-section">
              <div class="rewards-header">
                <h2>Rewards Store</h2>
                <div class="gems-balance">
                  <i class="fa-solid fa-gem"></i>
                  <span>${this.userProgress.gems} Gems Available</span>
                </div>
              </div>
              
              <div class="rewards-grid">
                ${this.renderRewards()}
              </div>
            </div>
          </div>

          <div class="tab-content" id="challenges-tab">
            <div class="daily-challenges-section">
              <div class="challenges-header">
                <h2>Daily Challenges</h2>
                <p>Complete these challenges to earn bonus XP and gems!</p>
              </div>
              
              <div class="challenges-grid">
                ${this.renderDailyChallenges()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getXPProgress() {
    const currentLevelXP = this.getXPForLevel(this.userProgress.level);
    const nextLevelXP = this.getXPForLevel(this.userProgress.level + 1);
    const progress = ((this.userProgress.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  getXPForNextLevel() {
    return this.getXPForLevel(this.userProgress.level + 1);
  }

  getXPForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  renderAchievements(filter = 'all') {
    const filteredAchievements = filter === 'all' 
      ? this.achievements 
      : this.achievements.filter(a => a.category === filter);
    
    return filteredAchievements.map(achievement => {
      const rarityClass = achievement.rarity;
      const unlockedClass = achievement.unlocked ? 'unlocked' : 'locked';
      
      return `
        <div class="achievement-card ${unlockedClass} ${rarityClass}" data-achievement-id="${achievement.id}">
          <div class="achievement-header">
            <div class="achievement-icon">
              <i class="${achievement.unlocked ? achievement.icon : 'fa-solid fa-lock'}"></i>
            </div>
            <div class="achievement-rarity ${achievement.rarity}">
              ${achievement.rarity.toUpperCase()}
            </div>
          </div>
          
          <h3 class="achievement-name">${achievement.name}</h3>
          <p class="achievement-description">${achievement.description}</p>
          
          <div class="achievement-rewards">
            <div class="reward-item">
              <i class="fa-solid fa-star"></i>
              <span>${achievement.xpReward} XP</span>
            </div>
            <div class="reward-item">
              <i class="fa-solid fa-gem"></i>
              <span>${achievement.gemReward} Gems</span>
            </div>
          </div>
          
          ${achievement.unlocked ? `
            <div class="achievement-unlocked-date">
              <i class="fa-solid fa-check-circle"></i>
              Unlocked
            </div>
          ` : `
            <div class="achievement-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${this.getAchievementProgress(achievement.id)}%"></div>
              </div>
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  getAchievementProgress(achievementId) {
    // Calculate progress for locked achievements
    const progress = {
      'first-lesson': this.userProgress.completedLessons.length > 0 ? 100 : 0,
      'week-streak': Math.min(100, (this.userProgress.currentStreak / 7) * 100),
      'month-streak': Math.min(100, (this.userProgress.currentStreak / 30) * 100),
      'code-master': Math.min(100, (this.userProgress.completedChallenges.length / 50) * 100),
      'xp-collector': Math.min(100, (this.userProgress.totalXP / 1000) * 100),
      'course-complete': 0, // Would need course completion data
      'speed-learner': 0, // Would need daily completion data
      'night-owl': 0, // Would need time-based data
      'early-bird': 0, // Would need time-based data
      'collaborator': 0, // Would need collaboration data
      'helper': 0, // Would need helping data
      'perfect-score': 0 // Would need perfect score data
    };
    
    return progress[achievementId] || 0;
  }

  renderLeaderboard() {
    return this.leaderboard.map(user => {
      const rankClass = user.rank <= 3 ? `top-${user.rank}` : '';
      const currentUserClass = user.isCurrentUser ? 'current-user' : '';
      
      return `
        <div class="leaderboard-item ${rankClass} ${currentUserClass}">
          <div class="rank">
            ${user.rank <= 3 ? `<i class="fa-solid fa-trophy rank-${user.rank}"></i>` : user.rank}
          </div>
          
          <div class="user-info">
            <div class="user-avatar">${user.avatar}</div>
            <div class="user-details">
              <div class="user-name">${user.name}</div>
              <div class="user-stats">
                Level ${user.level} • ${user.badges} badges • ${user.streak} day streak
              </div>
            </div>
          </div>
          
          <div class="user-xp">
            <i class="fa-solid fa-star"></i>
            ${user.xp.toLocaleString()}
          </div>
        </div>
      `;
    }).join('');
  }

  renderRewards() {
    const rewards = [
      {
        id: 'avatar-frame',
        name: 'Golden Avatar Frame',
        description: 'Custom golden frame for your profile picture',
        cost: 100,
        icon: 'fa-solid fa-circle-user',
        category: 'cosmetic',
        owned: false
      },
      {
        id: 'theme-unlock',
        name: 'Dark Theme Plus',
        description: 'Unlock premium dark theme variations',
        cost: 150,
        icon: 'fa-solid fa-palette',
        category: 'cosmetic',
        owned: false
      },
      {
        id: 'xp-boost',
        name: 'XP Boost (24h)',
        description: 'Double XP for 24 hours',
        cost: 200,
        icon: 'fa-solid fa-rocket',
        category: 'boost',
        owned: false
      },
      {
        id: 'course-hint',
        name: 'Course Hint Pack',
        description: '5 premium hints for any course',
        cost: 50,
        icon: 'fa-solid fa-lightbulb',
        category: 'utility',
        owned: false
      },
      {
        id: 'badge-display',
        name: 'Badge Showcase',
        description: 'Show off your top 3 achievements',
        cost: 75,
        icon: 'fa-solid fa-medal',
        category: 'cosmetic',
        owned: false
      },
      {
        id: 'streak-freeze',
        name: 'Streak Freeze',
        description: 'Protect your streak for one missed day',
        cost: 100,
        icon: 'fa-solid fa-shield-halved',
        category: 'utility',
        owned: false
      }
    ];

    return rewards.map(reward => `
      <div class="reward-card ${reward.owned ? 'owned' : ''}">
        <div class="reward-icon">
          <i class="${reward.icon}"></i>
        </div>
        
        <div class="reward-content">
          <h3 class="reward-name">${reward.name}</h3>
          <p class="reward-description">${reward.description}</p>
          <div class="reward-category">${reward.category}</div>
        </div>
        
        <div class="reward-action">
          ${reward.owned ? `
            <button class="owned-btn" disabled>
              <i class="fa-solid fa-check"></i> Owned
            </button>
          ` : `
            <button class="purchase-btn" onclick="gamification.purchaseReward('${reward.id}', ${reward.cost})" ${this.userProgress.gems < reward.cost ? 'disabled' : ''}>
              <i class="fa-solid fa-gem"></i> ${reward.cost}
            </button>
          `}
        </div>
      </div>
    `).join('');
  }

  renderDailyChallenges() {
    const challenges = [
      {
        id: 'daily-1',
        name: 'Quick Learner',
        description: 'Complete any 2 lessons today',
        progress: 1,
        total: 2,
        xpReward: 50,
        gemReward: 5,
        completed: false
      },
      {
        id: 'daily-2',
        name: 'Challenge Master',
        description: 'Solve 3 coding challenges',
        progress: 0,
        total: 3,
        xpReward: 75,
        gemReward: 8,
        completed: false
      },
      {
        id: 'daily-3',
        name: 'Social Butterfly',
        description: 'Help or comment on 2 lessons',
        progress: 1,
        total: 2,
        xpReward: 30,
        gemReward: 3,
        completed: false
      }
    ];

    return challenges.map(challenge => {
      const progressPercent = (challenge.progress / challenge.total) * 100;
      const completedClass = challenge.completed ? 'completed' : '';
      
      return `
        <div class="challenge-card ${completedClass}">
          <div class="challenge-header">
            <h3 class="challenge-name">${challenge.name}</h3>
            <div class="challenge-status">
              ${challenge.completed ? '<i class="fa-solid fa-check-circle"></i> Completed' : 'In Progress'}
            </div>
          </div>
          
          <p class="challenge-description">${challenge.description}</p>
          
          <div class="challenge-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="progress-text">${challenge.progress}/${challenge.total}</span>
          </div>
          
          <div class="challenge-rewards">
            <div class="reward-item">
              <i class="fa-solid fa-star"></i>
              <span>${challenge.xpReward} XP</span>
            </div>
            <div class="reward-item">
              <i class="fa-solid fa-gem"></i>
              <span>${challenge.gemReward} Gems</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Achievement filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.filterAchievements(filter);
      });
    });

    // Leaderboard filters
    document.querySelector('.time-filter')?.addEventListener('change', () => {
      this.updateLeaderboard();
    });

    document.querySelector('.category-filter')?.addEventListener('change', () => {
      this.updateLeaderboard();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
  }

  filterAchievements(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    const achievementsGrid = document.querySelector('.achievements-grid');
    if (achievementsGrid) {
      achievementsGrid.innerHTML = this.renderAchievements(filter);
    }
  }

  updateLeaderboard() {
    const timeFilter = document.querySelector('.time-filter')?.value || 'all-time';
    const categoryFilter = document.querySelector('.category-filter')?.value || 'xp';
    
    // In a real implementation, this would fetch filtered data
    console.log(`Updating leaderboard with filters: ${timeFilter}, ${categoryFilter}`);
    
    const leaderboardList = document.querySelector('.leaderboard-list');
    if (leaderboardList) {
      leaderboardList.innerHTML = this.renderLeaderboard();
    }
  }

  purchaseReward(rewardId, cost) {
    if (this.userProgress.gems < cost) {
      showToast('Not enough gems!', 'error');
      return;
    }

    if (confirm(`Purchase this reward for ${cost} gems?`)) {
      this.userProgress.gems -= cost;
      storage.saveUserProgress(this.userProgress);
      
      showToast('Reward purchased successfully!', 'success');
      
      // Update the rewards display
      const rewardsTab = document.querySelector('#rewards-tab');
      if (rewardsTab) {
        const rewardsGrid = rewardsTab.querySelector('.rewards-grid');
        if (rewardsGrid) {
          rewardsGrid.innerHTML = this.renderRewards();
        }
      }
      
      // Update gems display
      this.updateGemsDisplay();
    }
  }

  updateGemsDisplay() {
    const gemsCard = document.querySelector('.gems-card .stats-content h3');
    if (gemsCard) {
      gemsCard.textContent = `${this.userProgress.gems} Gems`;
    }
  }

  unlockAchievement(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    this.userProgress.achievements.push(achievementId);
    this.userProgress.totalXP += achievement.xpReward;
    this.userProgress.gems += achievement.gemReward;

    storage.saveUserProgress(this.userProgress);
    
    showToast(`Achievement Unlocked: ${achievement.name}! +${achievement.xpReward} XP, +${achievement.gemReward} Gems`, 'success');
    
    // Show achievement notification
    this.showAchievementNotification(achievement);
  }

  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-popup">
        <div class="achievement-icon">
          <i class="${achievement.icon}"></i>
        </div>
        <div class="achievement-details">
          <h4>Achievement Unlocked!</h4>
          <p>${achievement.name}</p>
          <div class="achievement-rewards">
            <span>+${achievement.xpReward} XP</span>
            <span>+${achievement.gemReward} Gems</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Global instance for event handlers
window.gamification = null;

// Export for use in router
export function renderGamification() {
  window.gamification = new GamificationComponent();
  return window.gamification.init();
}
