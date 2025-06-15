import { makeAutoObservable, runInAction } from 'mobx';
import { get, save, remove } from '../utils/db';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';
import languageStore from './languageStore';
import { createGroupedStoreMethods } from '../utils/groupedStoreUtils';

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

  get assistants() {
    return clientStore.client.assistants || [];
  }

  get filteredAssistants() {
    let filtered = this.assistants;

    // Filter out hidden assistants when not in admin mode
    if (!this.isAdminMode) {
      filtered = filtered.filter(assistant => !assistant.hidden);
    }

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
    return this.getGroupedItems();
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
    // Mix in grouped store methods
    Object.assign(this, createGroupedStoreMethods());
    
    makeAutoObservable(this);
    
    // Override methods after makeAutoObservable to ensure they take precedence
    this.handleToggleVisibility = (assistant) => {
      this.currentItem = assistant;
      this.showVisibilityDialog = true;
    };
    
    this.closeVisibilityDialog = () => {
      this.showVisibilityDialog = false;
      this.currentItem = null;
    };
    
    
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


  // Implementation methods for grouped store functionality
  confirmDelete = async () => {
    try {
      if (this.itemToDelete) {
        await remove('assistants', this.itemToDelete.id);
        await clientStore.loadClient();
        this.closeDeleteDialog();
      }
    } catch (error) {
      console.error('Error deleting assistant:', error);
    }
  };

  confirmVisibilityChange = async () => {
    if (this.currentItem) {
      await this.toggleAssistantVisibility(this.currentItem);
      await clientStore.loadClient();
      this.closeVisibilityDialog();
    }
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
      await this.fetchAssistants();
    } catch (error) {
      console.error('Failed to toggle assistant visibility:', error);
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

  moveAssistantInGroup = (group, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const currentGroupAssistants = [...this.groupedAssistants[group]];
    
    const [movedAssistant] = currentGroupAssistants.splice(fromIndex, 1);
    currentGroupAssistants.splice(toIndex, 0, movedAssistant);

    // Update order property for each assistant in the group
    currentGroupAssistants.forEach((assistant, index) => {
      assistant.order = index;
    });

    // Update the main assistants array
    const assistantsList = [...this.assistants];
    currentGroupAssistants.forEach(assistant => {
      const assistantIndex = assistantsList.findIndex(a => a.id === assistant.id);
      if (assistantIndex !== -1) {
        assistantsList[assistantIndex] = {
          ...assistantsList[assistantIndex],
          order: assistant.order
        };
      }
    });

    // Update the client's assistants array
    clientStore.client.assistants = assistantsList;
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


  // Implementation methods for grouped store functionality
  getGroupedItems() {
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
      
      // Ensure each assistant has an order property
      groupAssistants.forEach((assistant, index) => {
        if (typeof assistant.order !== 'number') {
          assistant.order = index;
        }
      });
      
      // Sort by order property
      grouped[group] = groupAssistants.sort((a, b) => a.order - b.order);
    });

    return grouped;
  }

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

  saveItemGroupOrder = async () => {
    try {
      // Save the current state of assistants with their updated positions
      await save('assistants', this.assistants);
      await clientStore.loadClient();
    } catch (error) {
      console.error('Error saving assistant group order:', error);
    }
  };


  addGroup = async (groupName) => {
    if (!groupName || !groupName.trim()) return;

    try {
      const newGroups = [...this.groupOrder, groupName.trim()];
      await clientStore.saveAssistantGroupOrder(newGroups);
      this.groupOrder = newGroups;
    } catch (error) {
      console.error('Error adding group:', error);
      throw error;
    }
  };

  editGroup = async (oldGroupName, newGroupName) => {
    if (!newGroupName || !newGroupName.trim() || !oldGroupName) return;

    try {
      const trimmedNewName = newGroupName.trim();
      
      // Update group name in assistants
      const updatedAssistants = this.assistants.map(assistant => ({
        ...assistant,
        group: assistant.group === oldGroupName ? trimmedNewName : assistant.group
      }));

      // Update group order
      const updatedGroupOrder = this.groupOrder.map(group =>
        group === oldGroupName ? trimmedNewName : group
      );

      // Save changes
      await save('assistants', updatedAssistants);
      await clientStore.saveAssistantGroupOrder(updatedGroupOrder);
      
      this.groupOrder = updatedGroupOrder;
      clientStore.client.assistants = updatedAssistants;
    } catch (error) {
      console.error('Error editing group:', error);
      throw error;
    }
  };


  deleteGroup = async (groupName) => {
    if (!groupName) return;

    try {
      const updatedGroupOrder = this.groupOrder.filter(group => group !== groupName);
      await clientStore.saveAssistantGroupOrder(updatedGroupOrder);
      this.groupOrder = updatedGroupOrder;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };
}

// Create and export a singleton instance
const assistantsStore = new AssistantsStore();
export default assistantsStore;