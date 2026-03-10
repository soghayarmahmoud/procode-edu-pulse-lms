// ============================================
// ProCode EduPulse — Quiz Component
// ============================================

import { $, createElement, showToast } from '../utils/dom.js';
import { storage } from '../services/storage.js';

export class QuizComponent {
    constructor(container, quizData, courseId, lessonId) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.quiz = quizData;
        this.courseId = courseId;
        this.lessonId = lessonId;
        this.answers = {};
        this.submitted = false;
        this.render();
    }

    render() {
        const existingScore = storage.getQuizScore(this.courseId, this.quiz.title);

        this.container.innerHTML = `
      <div class="assessment-section">
        <div class="assessment-header">
          <div class="assessment-title">
            📝 <span>${this.quiz.title}</span>
          </div>
          ${existingScore ? `<span class="badge badge-success">Best: ${existingScore.score}%</span>` : ''}
        </div>
        
        <div class="quiz-container" id="quiz-questions">
          ${this.quiz.questions.map((q, i) => this._renderQuestion(q, i)).join('')}
        </div>
        
        <div class="quiz-submit-area">
          <div class="quiz-score" id="quiz-score"></div>
          <div style="display:flex;gap:var(--space-3)">
            <button class="btn btn-secondary btn-sm" id="quiz-reset" style="display:none">
              ↻ Retry
            </button>
            <button class="btn btn-primary" id="quiz-submit">
              Submit Answers
            </button>
          </div>
        </div>
      </div>
    `;

        this._attachEvents();
    }

    _renderQuestion(question, index) {
        return `
      <div class="quiz-question" data-question-id="${question.id}">
        <div class="quiz-question-text">
          <span class="quiz-question-number">Q${index + 1}.</span>
          ${question.question}
        </div>
        <div class="quiz-options">
          ${question.options.map((opt, i) => `
            <div class="quiz-option" data-question="${question.id}" data-option="${i}">
              <span class="quiz-option-indicator"></span>
              <span>${opt}</span>
            </div>
          `).join('')}
        </div>
        <div class="quiz-explanation" id="explanation-${question.id}">
          💡 ${question.explanation}
        </div>
      </div>
    `;
    }

    _attachEvents() {
        // Option click
        this.container.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', () => {
                if (this.submitted) return;

                const questionId = option.dataset.question;
                const optionIndex = parseInt(option.dataset.option);

                // Deselect siblings
                this.container.querySelectorAll(`.quiz-option[data-question="${questionId}"]`).forEach(o => {
                    o.classList.remove('selected');
                });

                option.classList.add('selected');
                this.answers[questionId] = optionIndex;
            });
        });

        // Submit
        $('#quiz-submit', this.container).addEventListener('click', () => this.submit());

        // Reset
        $('#quiz-reset', this.container).addEventListener('click', () => this.reset());
    }

    submit() {
        if (this.submitted) return;

        // Check all questions answered
        if (Object.keys(this.answers).length < this.quiz.questions.length) {
            showToast('Please answer all questions before submitting.', 'warning');
            return;
        }

        this.submitted = true;
        let correct = 0;

        this.quiz.questions.forEach(q => {
            const selected = this.answers[q.id];
            const isCorrect = selected === q.correctIndex;
            if (isCorrect) correct++;

            // Highlight correct/incorrect
            this.container.querySelectorAll(`.quiz-option[data-question="${q.id}"]`).forEach((opt, i) => {
                if (i === q.correctIndex) {
                    opt.classList.add('correct');
                } else if (i === selected && !isCorrect) {
                    opt.classList.add('incorrect');
                }
            });

            // Show explanation
            const exp = $(`#explanation-${q.id}`, this.container);
            if (exp) exp.classList.add('visible');
        });

        const score = Math.round((correct / this.quiz.questions.length) * 100);
        const passed = score >= (this.quiz.passingScore || 70);

        $('#quiz-score', this.container).innerHTML = `
      <span style="color: ${passed ? 'var(--color-success)' : 'var(--color-error)'}">
        ${passed ? '🎉' : '😔'} Score: ${score}% (${correct}/${this.quiz.questions.length})
      </span>
    `;

        $('#quiz-submit', this.container).style.display = 'none';
        $('#quiz-reset', this.container).style.display = 'inline-flex';

        // Save score
        storage.saveQuizScore(this.courseId, this.quiz.title, score);

        // Mark lesson complete if passed
        if (passed) {
            storage.completeLesson(this.courseId, this.lessonId);
            showToast('Quiz passed! Lesson marked as complete.', 'success');
        } else {
            showToast(`You scored ${score}%. Need ${this.quiz.passingScore || 70}% to pass. Try again!`, 'warning');
        }
    }

    reset() {
        this.answers = {};
        this.submitted = false;
        this.render();
    }
}
