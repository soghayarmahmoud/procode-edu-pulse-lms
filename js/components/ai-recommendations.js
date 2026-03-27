// ============================================
// ProCode EduPulse — AI Learning Recommendations
// ============================================

import { $, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';
import { firestoreService } from '../services/firestore-service.js';

export class AIRecommendationsComponent {
  constructor() {
    this.userProfile = null;
    this.recommendations = [];
    this.init();
  }

  async init() {
    this.userProfile = await this.getUserProfile();
    await this.generateRecommendations();
    this.render();
  }

  async getUserProfile() {
    try {
      if (window.auth?.currentUser) {
        const userDoc = await firestoreService.getUserProgress(window.auth.currentUser.uid);
        return userDoc;
      }
    } catch (error) {
      console.warn('Firebase not available, using localStorage');
    }

    return storage.getUserProgress() || {
      completedLessons: [],
      completedChallenges: [],
      courseProgress: {},
      skillLevels: {},
      interests: [],
      learningGoals: [],
      timeSpent: {},
      weakAreas: []
    };
  }

  async generateRecommendations() {
    const userProfile = this.userProfile;
    
    // Analyze user's current skill level and learning patterns
    const skillAnalysis = this.analyzeSkills(userProfile);
    const learningPattern = this.analyzeLearningPattern(userProfile);
    const gaps = this.identifyKnowledgeGaps(userProfile);
    
    // Generate personalized recommendations
    this.recommendations = [
      ...this.generateCourseRecommendations(skillAnalysis, gaps),
      ...this.generateChallengeRecommendations(skillAnalysis),
      ...this.generateLearningPathRecommendations(learningPattern),
      ...this.generateResourceRecommendations(skillAnalysis),
      ...this.generateStudyScheduleRecommendations(learningPattern)
    ];

    // Sort by relevance score
    this.recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  analyzeSkills(userProfile) {
    const skills = {
      html: this.calculateSkillLevel(userProfile, 'html'),
      css: this.calculateSkillLevel(userProfile, 'css'),
      javascript: this.calculateSkillLevel(userProfile, 'javascript'),
      linux: this.calculateSkillLevel(userProfile, 'linux'),
      cpp: this.calculateSkillLevel(userProfile, 'cpp'),
      problemSolving: this.calculateSkillLevel(userProfile, 'problem-solving')
    };

    const strongestSkill = Object.entries(skills).reduce((a, b) => 
      skills[a[0]] > skills[b[0]] ? a : b
    );
    
    const weakestSkill = Object.entries(skills).reduce((a, b) => 
      skills[a[0]] < skills[b[0]] ? a : b
    );

    return { skills, strongestSkill, weakestSkill };
  }

  calculateSkillLevel(userProfile, skill) {
    // Simple algorithm to calculate skill level based on completed content
    const completedLessons = userProfile.completedLessons || [];
    const completedChallenges = userProfile.completedChallenges || [];
    
    let skillScore = 0;
    
    // Score from lessons
    completedLessons.forEach(lessonId => {
      if (lessonId.includes(skill)) skillScore += 10;
    });
    
    // Score from challenges
    completedChallenges.forEach(challengeId => {
      if (challengeId.includes(skill)) skillScore += 15;
    });
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.round((skillScore / 200) * 100));
  }

  analyzeLearningPattern(userProfile) {
    const weeklyActivity = userProfile.weeklyActivity || {};
    const preferredTime = this.analyzePreferredLearningTime(userProfile);
    const learningSpeed = this.calculateLearningSpeed(userProfile);
    const consistency = this.calculateConsistency(userProfile);
    
    return {
      weeklyActivity,
      preferredTime,
      learningSpeed,
      consistency
    };
  }

  analyzePreferredLearningTime(userProfile) {
    // Analyze when user is most active based on completion timestamps
    const timeSlots = {
      morning: 0,    // 6AM - 12PM
      afternoon: 0, // 12PM - 6PM
      evening: 0,    // 6PM - 12AM
      night: 0       // 12AM - 6AM
    };

    // This would analyze actual timestamps from user activity
    // For now, return a mock result
    return 'evening';
  }

  calculateLearningSpeed(userProfile) {
    const completedLessons = (userProfile.completedLessons || []).length;
    const accountAge = this.getAccountAgeInDays(userProfile);
    
    if (accountAge === 0) return 'normal';
    
    const lessonsPerDay = completedLessons / accountAge;
    
    if (lessonsPerDay > 2) return 'fast';
    if (lessonsPerDay < 0.5) return 'slow';
    return 'normal';
  }

  calculateConsistency(userProfile) {
    // Calculate how consistent the user's learning pattern is
    const weeklyActivity = userProfile.weeklyActivity || {};
    const activeDays = Object.values(weeklyActivity).filter(Boolean).length;
    
    if (activeDays >= 6) return 'high';
    if (activeDays >= 4) return 'medium';
    return 'low';
  }

  getAccountAgeInDays(userProfile) {
    const createdAt = userProfile.createdAt || Date.now() - (30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    return Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
  }

  identifyKnowledgeGaps(userProfile) {
    const gaps = [];
    const completedLessons = userProfile.completedLessons || [];
    
    // Check for fundamental gaps
    if (!completedLessons.some(lesson => lesson.includes('html-basics'))) {
      gaps.push({ area: 'html-basics', priority: 'high' });
    }
    
    if (!completedLessons.some(lesson => lesson.includes('css-fundamentals'))) {
      gaps.push({ area: 'css-fundamentals', priority: 'high' });
    }
    
    if (!completedLessons.some(lesson => lesson.includes('javascript-core'))) {
      gaps.push({ area: 'javascript-core', priority: 'medium' });
    }
    
    // Check for advanced gaps
    if (completedLessons.filter(lesson => lesson.includes('javascript')).length > 5) {
      if (!completedLessons.some(lesson => lesson.includes('async'))) {
        gaps.push({ area: 'javascript-async', priority: 'medium' });
      }
    }
    
    return gaps;
  }

  generateCourseRecommendations(skillAnalysis, gaps) {
    const recommendations = [];
    
    // Address knowledge gaps first
    gaps.forEach(gap => {
      recommendations.push({
        type: 'course',
        title: `Master ${this.formatSkillName(gap.area)}`,
        description: `Fill an important gap in your learning journey`,
        priority: gap.priority,
        relevanceScore: gap.priority === 'high' ? 90 : 70,
        actionUrl: `#/courses/${gap.area}`,
        icon: 'fa-solid fa-graduation-cap',
        reason: 'knowledge-gap'
      });
    });
    
    // Recommend next level courses
    if (skillAnalysis.strongestSkill[1] > 60) {
      const nextLevelCourse = this.getNextLevelCourse(skillAnalysis.strongestSkill[0]);
      if (nextLevelCourse) {
        recommendations.push({
          type: 'course',
          title: nextLevelCourse.title,
          description: `Build on your ${skillAnalysis.strongestSkill[0]} expertise`,
          priority: 'medium',
          relevanceScore: 75,
          actionUrl: nextLevelCourse.url,
          icon: 'fa-solid fa-arrow-trend-up',
          reason: 'skill-progression'
        });
      }
    }
    
    return recommendations;
  }

  generateChallengeRecommendations(skillAnalysis) {
    const recommendations = [];
    
    // Recommend challenges based on weakest skill
    const weakestSkill = skillAnalysis.weakestSkill[0];
    const skillLevel = skillAnalysis.weakestSkill[1];
    
    if (skillLevel < 50) {
      recommendations.push({
        type: 'challenge',
        title: `Practice ${this.formatSkillName(weakestSkill)}`,
        description: `Improve your weakest skill with targeted practice`,
        priority: 'high',
        relevanceScore: 80,
        actionUrl: `#/courses/${weakestSkill}-practice`,
        icon: 'fa-solid fa-dumbbell',
        reason: 'skill-improvement'
      });
    }
    
    // Recommend mixed challenges for balanced learning
    recommendations.push({
      type: 'challenge',
      title: 'Mixed Skill Challenge',
      description: 'Test your knowledge across multiple domains',
      priority: 'medium',
      relevanceScore: 65,
      actionUrl: '#/courses/mixed-challenges',
      icon: 'fa-solid fa-puzzle-piece',
      reason: 'balanced-learning'
    });
    
    return recommendations;
  }

  generateLearningPathRecommendations(learningPattern) {
    const recommendations = [];
    
    // Adjust recommendations based on learning speed
    if (learningPattern.learningSpeed === 'fast') {
      recommendations.push({
        type: 'learning-path',
        title: 'Accelerated Learning Path',
        description: 'Comprehensive path for fast learners',
        priority: 'medium',
        relevanceScore: 70,
        actionUrl: '#/roadmaps/accelerated',
        icon: 'fa-solid fa-rocket',
        reason: 'learning-speed'
      });
    } else if (learningPattern.learningSpeed === 'slow') {
      recommendations.push({
        type: 'learning-path',
        title: 'Steady Pace Learning Path',
        description: 'Build strong foundations with detailed explanations',
        priority: 'medium',
        relevanceScore: 70,
        actionUrl: '#/roadmaps/steady-pace',
        icon: 'fa-solid fa-turtle',
        reason: 'learning-speed'
      });
    }
    
    // Recommendations based on consistency
    if (learningPattern.consistency === 'low') {
      recommendations.push({
        type: 'learning-path',
        title: 'Habit Building Path',
        description: 'Short daily lessons to build consistency',
        priority: 'high',
        relevanceScore: 85,
        actionUrl: '#/roadmaps/habit-building',
        icon: 'fa-solid fa-calendar-check',
        reason: 'consistency-improvement'
      });
    }
    
    return recommendations;
  }

  generateResourceRecommendations(skillAnalysis) {
    const recommendations = [];
    
    // Recommend resources for weak areas
    const weakSkills = Object.entries(skillAnalysis.skills)
      .filter(([skill, level]) => level < 40)
      .map(([skill]) => skill);
    
    weakSkills.forEach(skill => {
      recommendations.push({
        type: 'resource',
        title: `${this.formatSkillName(skill)} Study Materials`,
        description: 'Curated resources to strengthen your foundation',
        priority: 'medium',
        relevanceScore: 60,
        actionUrl: `#/docs/${skill}-resources`,
        icon: 'fa-solid fa-book',
        reason: 'skill-improvement'
      });
    });
    
    return recommendations;
  }

  generateStudyScheduleRecommendations(learningPattern) {
    const recommendations = [];
    
    // Recommend optimal study times
    const optimalTime = learningPattern.preferredTime;
    recommendations.push({
      type: 'schedule',
      title: `Optimal Study Time: ${optimalTime.charAt(0).toUpperCase() + optimalTime.slice(1)}`,
      description: `Based on your learning patterns, ${optimalTime} sessions are most effective`,
      priority: 'low',
      relevanceScore: 50,
      actionUrl: '#/profile/schedule',
      icon: 'fa-solid fa-clock',
      reason: 'optimal-timing'
    });
    
    return recommendations;
  }

  getNextLevelCourse(skill) {
    const nextLevels = {
      html: { title: 'Advanced HTML & Semantic Web', url: '#/courses/advanced-html' },
      css: { title: 'CSS Animations & Advanced Layouts', url: '#/courses/advanced-css' },
      javascript: { title: 'Advanced JavaScript & ES6+', url: '#/courses/advanced-javascript' },
      linux: { title: 'Linux System Administration', url: '#/courses/linux-admin' },
      cpp: { title: 'Advanced C++ & Design Patterns', url: '#/courses/advanced-cpp' }
    };
    
    return nextLevels[skill] || null;
  }

  formatSkillName(skill) {
    const names = {
      'html': 'HTML',
      'css': 'CSS',
      'javascript': 'JavaScript',
      'linux': 'Linux',
      'cpp': 'C++',
      'problem-solving': 'Problem Solving',
      'html-basics': 'HTML Basics',
      'css-fundamentals': 'CSS Fundamentals',
      'javascript-core': 'JavaScript Core',
      'javascript-async': 'Asynchronous JavaScript'
    };
    
    return names[skill] || skill;
  }

  render() {
    const app = $('#app');
    if (!app) return;

    app.innerHTML = `
      <div class="ai-recommendations-page">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">AI Learning Recommendations</h1>
            <p class="page-description">Personalized learning suggestions based on your progress and goals</p>
          </div>

          <div class="recommendations-overview">
            <div class="overview-card">
              <div class="overview-icon">
                <i class="fa-solid fa-brain"></i>
              </div>
              <div class="overview-content">
                <h3>Smart Recommendations</h3>
                <p>${this.recommendations.length} personalized suggestions for you</p>
              </div>
            </div>
            
            <div class="overview-card">
              <div class="overview-icon">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <div class="overview-content">
                <h3>Learning Progress</h3>
                <p>Based on your recent activity and achievements</p>
              </div>
            </div>
            
            <div class="overview-card">
              <div class="overview-icon">
                <i class="fa-solid fa-bullseye"></i>
              </div>
              <div class="overview-content">
                <h3>Goal-Oriented</h3>
                <p>Tailored to help you reach your learning goals faster</p>
              </div>
            </div>
          </div>

          <div class="recommendations-sections">
            ${this.renderRecommendationsByType('course', '📚 Recommended Courses')}
            ${this.renderRecommendationsByType('challenge', '💪 Practice Challenges')}
            ${this.renderRecommendationsByType('learning-path', '🗺️ Learning Paths')}
            ${this.renderRecommendationsByType('resource', '📖 Study Resources')}
            ${this.renderRecommendationsByType('schedule', '⏰ Study Schedule')}
          </div>

          <div class="ai-insights">
            <h2>AI Insights</h2>
            <div class="insights-grid">
              ${this.renderAIInsights()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderRecommendationsByType(type, title) {
    const typeRecommendations = this.recommendations.filter(r => r.type === type);
    if (typeRecommendations.length === 0) return '';

    return `
      <div class="recommendation-section">
        <h3>${title}</h3>
        <div class="recommendation-grid">
          ${typeRecommendations.map(rec => this.renderRecommendationCard(rec)).join('')}
        </div>
      </div>
    `;
  }

  renderRecommendationCard(recommendation) {
    const priorityColors = {
      high: 'var(--color-error)',
      medium: 'var(--color-warning)',
      low: 'var(--color-info)'
    };

    return `
      <div class="recommendation-card" data-priority="${recommendation.priority}">
        <div class="recommendation-header">
          <div class="recommendation-icon">
            <i class="${recommendation.icon}"></i>
          </div>
          <div class="recommendation-priority" style="color: ${priorityColors[recommendation.priority]}">
            <i class="fa-solid fa-flag"></i> ${recommendation.priority}
          </div>
        </div>
        
        <h4 class="recommendation-title">${recommendation.title}</h4>
        <p class="recommendation-description">${recommendation.description}</p>
        
        <div class="recommendation-reason">
          <i class="fa-solid fa-lightbulb"></i>
          <span>Why: ${this.getReasonText(recommendation.reason)}</span>
        </div>
        
        <button class="recommendation-action" onclick="window.location.href='${recommendation.actionUrl}'">
          Start Learning <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    `;
  }

  getReasonText(reason) {
    const reasonTexts = {
      'knowledge-gap': 'Fills an important gap in your learning journey',
      'skill-progression': 'Builds on your existing strengths',
      'skill-improvement': 'Helps improve your weaker areas',
      'balanced-learning': 'Provides well-rounded practice',
      'learning-speed': 'Matches your learning pace',
      'consistency-improvement': 'Helps build better study habits',
      'optimal-timing': 'Optimized for your best learning times'
    };
    
    return reasonTexts[reason] || 'Personalized for your learning style';
  }

  renderAIInsights() {
    const skillAnalysis = this.analyzeSkills(this.userProfile);
    const learningPattern = this.analyzeLearningPattern(this.userProfile);
    
    return `
      <div class="insight-card">
        <h4>🎯 Strongest Skill</h4>
        <p>${this.formatSkillName(skillAnalysis.strongestSkill[0])} (${skillAnalysis.strongestSkill[1]}%)</p>
      </div>
      
      <div class="insight-card">
        <h4>📈 Area for Improvement</h4>
        <p>${this.formatSkillName(skillAnalysis.weakestSkill[0])} (${skillAnalysis.weakestSkill[1]}%)</p>
      </div>
      
      <div class="insight-card">
        <h4>⚡ Learning Speed</h4>
        <p>${learningPattern.learningSpeed.charAt(0).toUpperCase() + learningPattern.learningSpeed.slice(1)} pace</p>
      </div>
      
      <div class="insight-card">
        <h4>📅 Consistency</h4>
        <p>${learningPattern.consistency.charAt(0).toUpperCase() + learningPattern.consistency.slice(1)} consistency</p>
      </div>
      
      <div class="insight-card">
        <h4>🕐 Best Time to Learn</h4>
        <p>${learningPattern.preferredTime.charAt(0).toUpperCase() + learningPattern.preferredTime.slice(1)}</p>
      </div>
      
      <div class="insight-card">
        <h4>🎓 Next Milestone</h4>
        <p>Complete 5 more lessons to unlock achievement</p>
      </div>
    `;
  }
}

// Export for use in router
export function renderAIRecommendations() {
  const recommendations = new AIRecommendationsComponent();
  return recommendations.init();
}
