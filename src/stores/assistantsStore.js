import { makeAutoObservable, runInAction } from 'mobx';
import { get, save, remove } from '../utils/db';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';
import languageStore from './languageStore';

const defaultAssistant = {
  client_id: null,
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

  // Search and filter
  searchQuery = '';
  
  // OpenRouter models
  models = [];
  loadingModels = false;
  
  // Dialog states
  showDeleteDialog = false;
  assistantToDelete = null;
  showEditDialog = false;
  editingAssistant = {};
  isEditMode = false;

  // UI state
  expandedGroups = new Set();
  
  // Group ordering
  groupOrder = [];
  pendingGroups = null;

  get assistants() {
    return clientStore.client.assistants || [];
  }

  get filteredAssistants() {
    let filtered = this.assistants;

    // Filter by search keyword
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(assistant =>
        assistant.name?.toLowerCase().includes(query) ||
        assistant.greeting?.toLowerCase().includes(query) ||
        assistant.prompt?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  get groupedAssistants() {
    const assistantsToGroup = this.filteredAssistants;
    
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

  get isAdminMode() {
    // Check if current URL contains mode=edit parameter
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('mode') === 'edit';
    }
    return false;
  }

  get pageTitle() {
    return this.isAdminMode ? languageStore.t('menu.admin_page.manage_assistant') : languageStore.t('menu.ai');
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
  
  setAssistants(assistants) {
    this.assistants = assistants;
  }
  
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

  // Dialog state methods
  setShowDeleteDialog = (show) => {
    this.showDeleteDialog = show;
  };

  setAssistantToDelete = (assistant) => {
    this.assistantToDelete = assistant;
  };

  setShowEditDialog = (show) => {
    this.showEditDialog = show;
  };

  setEditingAssistant = (assistant) => {
    this.editingAssistant = { ...assistant };
  };

  setIsEditMode = (isEdit) => {
    this.isEditMode = isEdit;
  };

  // Assistant form field setters
  setEditingAssistantName = (name) => {
    this.editingAssistant.name = name;
  };

  setEditingAssistantGreeting = (greeting) => {
    this.editingAssistant.greeting = greeting;
  };

  setEditingAssistantPrompt = (prompt) => {
    this.editingAssistant.prompt = prompt;
  };

  setEditingAssistantModel = (model) => {
    this.editingAssistant.model = model;
  };

  setEditingAssistantGroup = (group) => {
    this.editingAssistant.group = group;
  };

  setEditingAssistantImage = (image) => {
    this.editingAssistant.image = image;
  };

  uploadAssistantIcon = async (file, assistantId) => {
    try {
      return await uploadToCloudinary(file, `${clientStore.client.id}/assistants/${assistantId}`);
    } catch (error) {
      console.error('Error uploading assistant icon:', error);
      throw error;
    }
  };

  // Handle methods following membership store pattern
  handleEdit = (assistant) => {
    this.setEditingAssistant(assistant);
    this.setIsEditMode(true);
    this.setShowEditDialog(true);
  };

  handleDelete = (assistant) => {
    this.setAssistantToDelete(assistant);
    this.setShowDeleteDialog(true);
  };

  confirmDelete = async () => {
    try {
      if (this.assistantToDelete) {
        await remove('assistants', this.assistantToDelete.id);
        await clientStore.loadClient();
        this.setShowDeleteDialog(false);
        this.setAssistantToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting assistant:', error);
    }
  };

  closeDeleteDialog = () => {
    this.setShowDeleteDialog(false);
    this.setAssistantToDelete(null);
  };

  handleCreateNew = () => {
    this.setEditingAssistant({
      client_id: clientStore.client.id,
      name: '',
      greeting: '',
      prompt: '',
      image: '',
      model: '',
      group: ''
    });
    this.setIsEditMode(false);
    this.setShowEditDialog(true);
  };

  closeEditDialog = () => {
    this.setShowEditDialog(false);
    this.setEditingAssistant({});
    this.setIsEditMode(false);
  };

  saveAssistant = async () => {
    try {
      const assistant = { ...this.editingAssistant };
      
      // Save to database
      await save('assistants', assistant);
      await clientStore.loadClient();
      this.closeEditDialog();
    } catch (error) {
      console.error('Error saving assistant:', error);
    }
  };
  async fetchOpenRouterModels() {
    this.loadingModels = true;
    
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
        this.loadingModels = false;
      });
      console.error('Error fetching OpenRouter models:', error);
    }
  }

  // Toggle assistant visibility
  toggleAssistantVisibility = async (assistant) => {
    try {
      const updatedAssistant = {
        ...assistant,
        hidden: !assistant.hidden
      };

      await save('assistants', updatedAssistant);
      await clientStore.loadClient();
    } catch (error) {
      console.error('Failed to toggle assistant visibility:', error);
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
    if (this.isAdminMode) {
      this.handleEdit(assistant);
    } else {
      navigate(`/assistants/${assistant.id}/chat`);
    }
  };

  handleToggleVisibility = async (assistant) => {
    await this.toggleAssistantVisibility(assistant);
  };

  // Drag and drop methods
  moveAssistant = (fromIndex, toIndex) => {
    // Get the items being moved
    const fromItem = this.filteredAssistants[fromIndex];
    const toItem = this.filteredAssistants[toIndex];
    
    if (!fromItem || !toItem) return;
    
    // Update the order in the original assistants array
    const allAssistants = [...this.assistants];
    const fromOriginalIndex = allAssistants.findIndex(a => a.id === fromItem.id);
    const toOriginalIndex = allAssistants.findIndex(a => a.id === toItem.id);
    
    if (fromOriginalIndex !== -1 && toOriginalIndex !== -1) {
      const [originalMovedItem] = allAssistants.splice(fromOriginalIndex, 1);
      allAssistants.splice(toOriginalIndex, 0, originalMovedItem);
      
      // Update the client's assistants array
      clientStore.client.assistants = allAssistants;
    }
  };

  saveAssistantOrder = async () => {
    try {
      const assistantsWithOrder = this.assistants.map((assistant, index) => ({
        ...assistant,
        order: index
      }));
      
      await save('assistants', assistantsWithOrder);
      await clientStore.loadClient();
    } catch (error) {
      console.error('Error saving assistant order:', error);
    }
  };

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