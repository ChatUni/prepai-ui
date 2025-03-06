import { makeObservable, observable, action, runInAction } from 'mobx';

class ExamStore {
  questions = [];
  selectedAnswers = new Map(); // Map of questionId -> selected option
  isSubmitted = false;
  showResults = false;
  examResults = { correct: 0, incorrect: 0 };
  
  constructor() {
    makeObservable(this, {
      questions: observable,
      selectedAnswers: observable,
      isSubmitted: observable,
      showResults: observable,
      examResults: observable,
      fetchQuestions: action,
      selectAnswer: action,
      submitExam: action,
      resetExam: action,
      closeResults: action
    });
  }
  
  async fetchQuestions(courseId) {
    try {
      const response = await fetch(`http://localhost:3001/api/questions/random?courseId=${courseId}&count=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const questions = await response.json();
      
      runInAction(() => {
        this.questions = questions;
        this.selectedAnswers.clear();
        this.isSubmitted = false;
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      runInAction(() => {
        this.questions = [];
        this.selectedAnswers.clear();
        this.isSubmitted = false;
      });
    }
  }
  
  selectAnswer(questionId, option) {
    if (!this.isSubmitted) {
      this.selectedAnswers.set(questionId, option);
    }
  }
  
  submitExam() {
    let correct = 0;
    let incorrect = 0;
    
    this.questions.forEach(question => {
      const selectedAnswer = this.selectedAnswers.get(question.id);
      if (selectedAnswer) {
        const options = JSON.parse(question.options);
        if (selectedAnswer === options[question.answer.charCodeAt(0) - 65]) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });
    
    runInAction(() => {
      this.isSubmitted = true;
      this.examResults = { correct, incorrect };
      this.showResults = true;
    });
  }

  closeResults() {
    this.showResults = false;
  }
  
  resetExam() {
    runInAction(() => {
      this.questions = [];
      this.selectedAnswers.clear();
      this.isSubmitted = false;
      this.showResults = false;
      this.examResults = { correct: 0, incorrect: 0 };
    });
  }
}

const examStore = new ExamStore();
export default examStore;