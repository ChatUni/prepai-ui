import { makeAutoObservable, observable, runInAction } from 'mobx';
import { shuffleArray } from '../utils/utils';

class QuestionStore {
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

  setQuestions(questions) {
    this.questions = shuffleArray(questions).slice(0, 20)
      .filter(q => q.option)
      .map(q => ({ ...q, options: Object.values(q.option || {}), id: +q.section * 1000 + +q.no }));
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
        const options = question.options;
        if (this.correctOptions(question).includes(selectedAnswer)) {
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
  
  // Method to determine if an answer is correct for a given question
  isCorrectAnswer(questionId, option) {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) return false;
    
    return this.correctOptions(question).includes(option);
  }
  
  getAnswers(q) {
    return Array.isArray(q.answer) ? q.answer : [q.answer];
  }

  correctOptions(q) {
    return this.getAnswers(q).map(a => q.options[a.charCodeAt(0) - 65]);
  }

  get getOptionClass() {
    return (questionId, option) => {
      let optionClass = "p-3 rounded-lg border cursor-pointer transition-colors";
      const question = this.questions.find(q => q.id === questionId);
      if (!question) return optionClass;
      
      const selectedAnswer = this.getSelectedAnswer(questionId);
      
      if (this.isSubmitted) {
        if (this.correctOptions(question).includes(option)) {
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

const questionStore = new QuestionStore();
export default questionStore;