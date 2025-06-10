import { makeAutoObservable, runInAction } from 'mobx';
import db, { get } from '../utils/db';
import { getApiBaseUrl } from '../config';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';

const defaultAssistant = {
  id: null,
  name: '',
  greeting: '',
  prompt: '',
  image: '',
  model: ''
};

class AssistantsStore {
  // Assistants data
  assistants = [];
  loading = false;
  error = null;
  
  // OpenRouter models
  models = [];
  loadingModels = false;
  
  // Search filter
  searchQuery = '';
  
  // New assistant form state
  currentAssistant = {...defaultAssistant}

  isEditMode = false;

  get filteredAssistants() {
    if (!this.searchQuery) return this.assistants;
    
    const query = this.searchQuery.toLowerCase();
    return this.assistants.filter(assistant =>
      assistant.name?.toLowerCase().includes(query) ||
      assistant.greeting?.toLowerCase().includes(query) ||
      assistant.prompt?.toLowerCase().includes(query)
    );
  }
  
  constructor() {
    makeAutoObservable(this);
    this.fetchOpenRouterModels();
  }

  async fetchAssistants() {
    this.loading = true;
    this.error = null;
    
    try {
      const platform_assistants = await get('platform_assistants');
      const client_assistants = await get('client_assistants', { clientId: clientStore.client.id });
      
      runInAction(() => {
        this.assistants = [...(platform_assistants || []), ...(client_assistants || [])];
        this.loading = false;
      });
    } catch (error) {
      console.error('Error fetching assistants:', error);
      
      runInAction(() => {
        this.error = error.message;
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
    this.resetAssistant();
  }

  // Search method
  setSearchQuery = (query) => {
    this.searchQuery = query;
  };

  // Assistant form methods
  setAssistantField = (field, value) => {
    this.currentAssistant[field] = value;
  };

  resetAssistant = () => {
    this.currentAssistant = {...defaultAssistant};
    this.isEditMode = false;
  };

  uploadAssistantIcon = async (file, assistantId) => {
    try {
      return await uploadToCloudinary(file, `${clientStore.client.id}/assistants/${assistantId}`);
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  };

  selectedImagePreview = null;

  setSelectedImagePreview = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        runInAction(() => {
          this.selectedImagePreview = reader.result;
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedImagePreview = null;
    }
  };

  saveAssistant = async (formData) => {
    this.loading = true;
    this.error = null;

    try {
      // First save the assistant data
      const assistantData = {
        id: this.currentAssistant.id,
        name: this.currentAssistant.name,
        greeting: this.currentAssistant.greeting,
        prompt: this.currentAssistant.prompt,
        image: this.currentAssistant.image,
        model: this.currentAssistant.model
      };

      const response = await fetch(`${getApiBaseUrl()}/save?doc=assistants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assistantData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create assistant: ${response.statusText}`);
      }

      const savedAssistant = await response.json();

      // If there's a new icon file, upload it
      const iconFile = formData.get('icon');
      if (iconFile instanceof File) {
        const imageUrl = await this.uploadAssistantIcon(iconFile, savedAssistant.id);
        savedAssistant.image = imageUrl;
        
        // Update the assistant with the new icon URL
        await fetch(`${getApiBaseUrl()}/save?doc=assistants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedAssistant)
        });
      }
      
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
        this.selectedImagePreview = null;
        this.loading = false;
      });

      return savedAssistant;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  };
  
  setAssistant(id) {
    this.currentAssistant = this.assistants.find(a => a.id === +(id || 0)) || {...defaultAssistant} ;
    this.isEditMode = !!id;
  }
  async fetchOpenRouterModels() {
    this.loadingModels = true;
    this.error = null;
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      runInAction(() => {
        // Filter for free models only
        this.models = data.data.filter(model => (model.name || '').endsWith('(free)') || (model.pricing?.prompt === '0' && model.pricing?.completion === '0'));
        this.loadingModels = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loadingModels = false;
      });
    }
  }
}

// Create and export a singleton instance
const assistantsStore = new AssistantsStore();
export default assistantsStore;