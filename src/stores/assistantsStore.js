import { makeAutoObservable, runInAction } from 'mobx';
import db from '../utils/db';
import { getApiBaseUrl } from '../config';

class AssistantsStore {
  // Assistants data
  assistants = [];
  loading = false;
  error = null;
  
  // New assistant form state
  currentAssistant = {
    id: null,
    name: '',
    greeting: '',
    prompt: '',
    iconUrl: ''
  };

  isEditMode = false;
  
  constructor() {
    makeAutoObservable(this);
  }

  async fetchAssistants() {
    this.loading = true;
    this.error = null;
    
    try {
      const assistants = await db.getAllAssistants();
      
      runInAction(() => {
        this.assistants = assistants || [];
        this.loading = false;
      });
    } catch (error) {
      console.error('Error fetching assistants:', error);
      
      runInAction(() => {
        this.error = errorMessage;
        this.loading = false;
      });
    }
  }
  
  /**
   * Set assistants data
   * @param {Array} assistants - Array of assistant objects
   */
  setAssistants(assistants) {
    this.assistants = assistants;
  }
  
  /**
   * Reset the store state
   */
  reset() {
    this.assistants = [];
    this.loading = false;
    this.error = null;
    this.resetNewAssistant();
  }

  // Assistant form methods
  setAssistantField = (field, value) => {
    this.currentAssistant[field] = value;
  };

  resetAssistant = () => {
    this.currentAssistant = {
      id: null,
      name: '',
      greeting: '',
      prompt: '',
      iconUrl: ''
    };
    this.isEditMode = false;
  };

  saveAssistant = async () => {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`${getApiBaseUrl()}/assistants/${this.currentAssistant.id || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.currentAssistant)
      });

      if (!response.ok) {
        throw new Error(`Failed to create assistant: ${response.statusText}`);
      }

      const savedAssistant = await response.json();
      
      runInAction(() => {
        if (this.isEditMode) {
          const index = this.assistants.findIndex(a => a.id === savedAssistant.id);
          if (index !== -1) {
            this.assistants[index] = savedAssistant;
          }
        } else {
          this.assistants.push(savedAssistant);
        }
        this.resetAssistant();
        this.loading = false;
      });

      return newAssistant;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  };
}

// Create and export a singleton instance
const assistantsStore = new AssistantsStore();
export default assistantsStore;