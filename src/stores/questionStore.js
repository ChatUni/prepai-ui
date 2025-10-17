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
        const question = this.questions.find(q => q.id === questionId);
        if (this.isMulti(question)) {
          // Multi-select: add/remove option from array
          const currentAnswers = this.selectedAnswers.get(questionId) || [];
          const updatedAnswers = currentAnswers.includes(option)
            ? currentAnswers.filter(ans => ans !== option)
            : [...currentAnswers, option];
          this.selectedAnswers.set(questionId, updatedAnswers);
        } else {
          // Single select: toggle selection (unselect if already selected)
          const currentAnswer = this.selectedAnswers.get(questionId);
          if (currentAnswer === option) {
            this.selectedAnswers.delete(questionId);
          } else {
            this.selectedAnswers.set(questionId, option);
          }
        }
      });
    }
  }
  
  submitExam() {
    let correct = 0;
    let incorrect = 0;
    
    this.questions.forEach(question => {
      const result = this.isQuestionAnsweredCorrectly(question);
      if (result === true) {
        correct++;
      } else if (result === false) {
        incorrect++;
      }
      // result === null means unanswered, so we don't count it
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

  // Method to determine if a question's selected answer is correct (handles both single and multi-select)
  // Returns: true if correct, false if incorrect, null if not answered
  isQuestionAnsweredCorrectly(question) {
    const selectedAnswer = this.getSelectedAnswer(question.id);
    if (!selectedAnswer) return null;
    
    const correctOptions = this.correctOptions(question);
    
    if (this.isMulti(question)) {
      // For multi-select: check if arrays are identical
      const selectedArray = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer];
      return correctOptions.length === selectedArray.length &&
        correctOptions.every(option => selectedArray.includes(option));
    } else {
      // For single select: check if option is in correct options
      return correctOptions.includes(selectedAnswer);
    }
  }
  
  getAnswers(q) {
    return Array.isArray(q.answer) ? q.answer : [q.answer];
  }

  correctOptions(q) {
    return this.getAnswers(q).map(a => q.options[a.charCodeAt(0) - 65]);
  }

  isMulti(q) {
    return this.correctOptions(q).length > 1;
  }

  getCorrectAnswersText(question) {
    const correctOptions = this.correctOptions(question);
    const correctLetters = correctOptions.map(option => {
      const index = question.options.indexOf(option);
      return String.fromCharCode(65 + index); // Convert to A, B, C, D...
    });
    return correctLetters.join(', ');
  }

  get getOptionClass() {
    return (questionId, option) => {
      let optionClass = "p-3 rounded-lg border cursor-pointer transition-colors";
      const question = this.questions.find(q => q.id === questionId);
      if (!question) return optionClass;
      
      const selectedAnswer = this.getSelectedAnswer(questionId);
      const isSelected = this.isMulti(question)
        ? Array.isArray(selectedAnswer) && selectedAnswer.includes(option)
        : selectedAnswer === option;
      
      const green = " bg-green-100 border-green-500"
      const red = " bg-red-100 border-red-500"
      const blue = " bg-blue-100 border-blue-500"
      
      if (isSelected) optionClass += blue;

      if (this.isSubmitted) {
        if (isSelected) {
          optionClass += blue;
        } else if (this.correctOptions(question).includes(option)) { // correct
          optionClass += green;
        } else { // incorrect
          optionClass += " border-gray-200";
        }
      } else {
        // Not submitted yet - show selection in blue
        optionClass += isSelected
          ? blue
          : " hover:bg-gray-50 border-gray-200";
      }
      
      return optionClass;
    };
  }
}

const questionStore = new QuestionStore();
export default questionStore;