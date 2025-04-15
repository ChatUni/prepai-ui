import { makeAutoObservable, runInAction } from 'mobx';
import db from '../utils/db';
import { getApiBaseUrl } from '../config';

class AssistantsStore {
  // Assistants data
  assistants = [];
  loading = false;
  error = null;
  
  // New assistant form state
  newAssistant = {
    name: '',
    greeting: '',
    prompt: '',
    iconUrl: ''
  };
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Fetch all assistants from the API
   * @param {number} retryCount - Number of retry attempts (default: 0)
   * @param {number} timeout - Timeout in milliseconds (default: 15000)
   */
  async fetchAssistants(retryCount = 0, timeout = 15000) {
    this.loading = true;
    this.error = null;
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Database connection may be unavailable.')), timeout);
      });
      
      // Race the actual fetch against the timeout
      const assistants = await Promise.race([
        db.getAllAssistants(),
        timeoutPromise
      ]);
      
      runInAction(() => {
        this.assistants = assistants || [];
        this.loading = false;
      });
    } catch (error) {
      console.error('Error fetching assistants:', error);
      
      // Check if we should retry on timeout
      if (error.message.includes('timed out') && retryCount < 2) {
        console.log(`Retrying fetch assistants (attempt ${retryCount + 1})...`);
        runInAction(() => {
          this.error = `Connection timed out. Retrying (attempt ${retryCount + 1})...`;
        });
        
        // Retry with exponential backoff
        setTimeout(() => {
          this.fetchAssistants(retryCount + 1, timeout * 1.5);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      // Format user-friendly error message based on error type
      let errorMessage = error.message;
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out')) {
        errorMessage = '数据库连接超时。请检查网络连接或联系管理员。';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = '网络错误。请检查您的互联网连接。';
      }
      
      runInAction(() => {
        this.error = errorMessage;
        this.loading = false;
        
        // In development mode, set fallback data
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using fallback assistants data');
          this.assistants = [
            { id: 1, name: 'Math' },
            { id: 2, name: 'Physics' },
            { id: 3, name: 'Chemistry' }
          ];
        }
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

  // New assistant form methods
  setNewAssistantField = (field, value) => {
    this.newAssistant[field] = value;
  };

  resetNewAssistant = () => {
    this.newAssistant = {
      name: '',
      greeting: '',
      prompt: '',
      iconUrl: ''
    };
  };

  createAssistant = async () => {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`${getApiBaseUrl()}/assistants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.newAssistant)
      });

      if (!response.ok) {
        throw new Error(`Failed to create assistant: ${response.statusText}`);
      }

      const newAssistant = await response.json();
      
      runInAction(() => {
        this.assistants.push(newAssistant);
        this.resetNewAssistant();
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