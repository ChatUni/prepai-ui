import { makeAutoObservable, runInAction } from 'mobx';
import db, { get } from '../utils/db';
import { getApiBaseUrl } from '../config';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';
import languageStore from './languageStore';
import routeStore from './routeStore';

const defaultAssistant = {
  id: null,
  name: '',
  greeting: '',
  prompt: '',
  image: '',
  model: '',
  group: ''
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

  // UI state
  expandedGroups = new Set();
  
  // Group ordering
  groupOrder = [];
  pendingGroups = null;

  get filteredAssistants() {
    if (!this.searchQuery) return this.assistants;
    
    const query = this.searchQuery.toLowerCase();
    return this.assistants.filter(assistant =>
      assistant.name?.toLowerCase().includes(query) ||
      assistant.greeting?.toLowerCase().includes(query) ||
      assistant.prompt?.toLowerCase().includes(query)
    );
  }

  get groupedAssistants() {
    const assistantsToGroup = this.searchQuery ? this.filteredAssistants : this.assistants;
    
    // Initialize groupOrder if empty - load from saved assistant group order
    if (this.groupOrder.length === 0) {
      this.groupOrder = clientStore.client.settings.assistantGroups ||
        [...new Set(assistantsToGroup.map(assistant => assistant.group || 'Default'))];
    }

    const groups = this.groupOrder;
    const grouped = {};

    groups.forEach(group => {
      const groupAssistants = assistantsToGroup.filter(assistant => (assistant.group || 'Default') === group);
      grouped[group] = groupAssistants;
    });

    return grouped;
  }

  get isEditMode() {
    // Check if current URL contains mode=edit parameter
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('mode') === 'edit';
    }
    return false;
  }

  get pageTitle() {
    return this.isEditMode ? languageStore.t('menu.admin_page.manage_assistant') : languageStore.t('menu.ai');
  }

  get isEmpty() {
    return !this.loading && !this.error && !this.assistants.length;
  }

  get loadingMessage() {
    if (this.loading) return languageStore.t('menu.categories.assistant.loading');
    if (this.error) return languageStore.t('menu.categories.assistant.loadingFailed');
    if (!this.assistants.length) return languageStore.t('menu.categories.assistant.notFound');
    return null;
  }
  
  constructor() {
    makeAutoObservable(this);
    this.fetchOpenRouterModels();
  }

  async fetchAssistants() {
    this.loading = true;
    this.error = null;
    
    try {
      const platform_assistants = [] // await get('platform_assistants');
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
        model: this.currentAssistant.model,
        group: this.currentAssistant.group
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

  // Toggle assistant visibility
  toggleAssistantVisibility = async (assistant) => {
    try {
      const updatedAssistant = {
        ...assistant,
        hidden: !assistant.hidden
      };

      const response = await fetch(`${getApiBaseUrl()}/save?doc=assistants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAssistant)
      });

      if (!response.ok) {
        throw new Error(`Failed to update assistant: ${response.statusText}`);
      }

      runInAction(() => {
        const index = this.assistants.findIndex(a => a.id === assistant.id);
        if (index !== -1) {
          this.assistants[index] = updatedAssistant;
        }
      });

      return updatedAssistant;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  };

  // Delete assistant
  deleteAssistant = async (assistant) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/delete?doc=assistants&id=${assistant.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete assistant: ${response.statusText}`);
      }

      runInAction(() => {
        this.assistants = this.assistants.filter(a => a.id !== assistant.id);
      });

      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  };

  // UI state methods
  isGroupExpanded = (group) => {
    return this.expandedGroups.has(group);
  };

  toggleGroup = (group) => {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  };

  // Navigation methods
  handleAssistantClick = (assistant, navigate) => {
    if (this.isEditMode) {
      navigate(`/assistants/${assistant.id}/edit`);
    } else {
      navigate(`/assistants/${assistant.id}/chat`);
    }
  };

  handleEdit = (assistant, navigate) => {
    navigate(`/assistants/${assistant.id}/edit`);
  };

  handleAddAssistant = (navigate) => {
    navigate('/assistants/add');
  };

  handleToggleVisibility = async (assistant) => {
    try {
      await this.toggleAssistantVisibility(assistant);
    } catch (error) {
      console.error('Failed to toggle assistant visibility:', error);
    }
  };

  handleDelete = async (assistant) => {
    if (window.confirm(languageStore.t('assistants.confirmDelete', { name: assistant.name }))) {
      try {
        await this.deleteAssistant(assistant);
      } catch (error) {
        console.error('Failed to delete assistant:', error);
      }
    }
  };

  // Drag and drop methods
  moveGroup = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const groups = this.groupOrder.length > 0
      ? [...this.groupOrder]
      : Object.keys(this.groupedAssistants);

    const [removed] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, removed);
    
    this.groupOrder = groups;
    this.pendingGroups = groups;
  };

  saveGroupOrder = async () => {
    if (!this.pendingGroups) return;

    try {
      await clientStore.saveAssistantGroupOrder(this.pendingGroups);
      this.pendingGroups = null;
    } catch (error) {
      console.error('Failed to save assistant group order:', error);
      throw error;
    }
  };
}

// Create and export a singleton instance
const assistantsStore = new AssistantsStore();
export default assistantsStore;