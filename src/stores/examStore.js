import { makeAutoObservable, observable, runInAction } from 'mobx';
import { getApiBaseUrl } from '../config.js';

class ExamStore {
  questions = [];
  selectedAnswers = observable.map({}); // Map of questionId -> selected option
  isSubmitted = false;
  showResults = false;
  examResults = { correct: 0, incorrect: 0 };
  isLoading = false;
  
  constructor() {
    makeAutoObservable(this);
  }

  get getSelectedAnswer() {
    return (questionId) => this.selectedAnswers.get(questionId);
  }
  async fetchQuestions(courseId) {
    this.isLoading = true;
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/questions/random?courseId=${courseId}&count=10`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }
    
    const questions = await response.json();
    
    runInAction(() => {
      this.questions = questions;
      this.selectedAnswers.clear();
      this.isSubmitted = false;
    });
    
    return questions;
    } catch (error) {
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
  
  selectAnswer(questionId, option) {
    if (!this.isSubmitted) {
      runInAction(() => {
        this.selectedAnswers.set(questionId, option);
      });
    }
  }
  
  submitExam() {
    let correct = 0;
    let incorrect = 0;
    
    this.questions.forEach(question => {
      const selectedAnswer = this.getSelectedAnswer(question.id);
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
  
  // Computed property that returns questions with parsed options
  get questionsWithParsedOptions() {
    return this.questions.map(question => ({
      ...question,
      parsedOptions: JSON.parse(question.options)
    }));
  }
  
  // Method to determine if an answer is correct for a given question
  isCorrectAnswer(questionId, option) {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return false;
    
    const options = JSON.parse(question.options);
    return option === options[question.answer.charCodeAt(0) - 65];
  }
  
  get getOptionClass() {
    return (questionId, option) => {
      let optionClass = "p-3 rounded-lg border cursor-pointer transition-colors";
      const question = this.questions.find(q => q.id === questionId);
      if (!question) return optionClass;
      
      const selectedAnswer = this.getSelectedAnswer(questionId);
      const options = JSON.parse(question.options);
      const correctAnswer = options[question.answer.charCodeAt(0) - 65];
      
      if (this.isSubmitted) {
        if (option === correctAnswer) {
          // Always show correct answer in green after submission
          optionClass += " bg-green-100 border-green-500";
        } else if (selectedAnswer === option) {
          // Show incorrect selected answer in red
          optionClass += " bg-red-100 border-red-500";
        } else {
          optionClass += " border-gray-200";
        }
      } else {
        // Not submitted yet - show selection in blue
        optionClass += selectedAnswer === option
          ? " bg-blue-100 border-blue-500"
          : " hover:bg-gray-50 border-gray-200";
      }
      
      return optionClass;
    };
  }
}

const examStore = new ExamStore();
export default examStore;