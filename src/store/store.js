// store.js
export const store = {
  state: {
    courses: [],
    lessons: [],
    quizzes: [],
    challenges: [],
    roadmaps: [],
    docs: [],
    modules: [],
    user: null
  },
  listeners: [],
  set(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(fn => fn(this.state));
  },
  subscribe(fn) {
    this.listeners.push(fn);
  }
};