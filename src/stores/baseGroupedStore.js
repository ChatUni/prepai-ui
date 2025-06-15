import { makeAutoObservable } from 'mobx';

class BaseGroupedStore {
  // UI state
  expandedGroups = new Set();
  
  // Group ordering
  groupOrder = [];
  pendingGroups = null;

  // Dialog states
  showDeleteDialog = false;
  itemToDelete = null;
  showVisibilityDialog = false;
  currentItem = null;

  constructor() {
    // Don't call makeAutoObservable here - let subclasses handle it
  }

  // Group expansion methods
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

  // Group ordering methods
  moveGroup = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const groups = this.groupOrder.length > 0
      ? [...this.groupOrder]
      : Object.keys(this.getGroupedItems());

    const [removed] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, removed);
    
    this.groupOrder = groups;
    this.pendingGroups = groups;
  };

  // Dialog state methods
  setShowDeleteDialog = (show) => {
    this.showDeleteDialog = show;
  };

  setItemToDelete = (item) => {
    this.itemToDelete = item;
  };

  closeDeleteDialog = () => {
    this.setShowDeleteDialog(false);
    this.setItemToDelete(null);
  };

  openVisibilityDialog = (item) => {
    this.currentItem = item;
    this.showVisibilityDialog = true;
  };

  closeVisibilityDialog = () => {
    this.showVisibilityDialog = false;
    this.currentItem = null;
  };

  handleToggleVisibility = (item) => {
    this.openVisibilityDialog(item);
  };

  handleDelete = (item) => {
    this.setItemToDelete(item);
    this.setShowDeleteDialog(true);
  };

  // Abstract methods to be implemented by subclasses
  getGroupedItems() {
    throw new Error('getGroupedItems must be implemented by subclass');
  }

  moveItemInGroup(group, fromIndex, toIndex) {
    throw new Error('moveItemInGroup must be implemented by subclass');
  }

  saveGroupOrder() {
    throw new Error('saveGroupOrder must be implemented by subclass');
  }

  saveItemGroupOrder() {
    throw new Error('saveItemGroupOrder must be implemented by subclass');
  }

  confirmDelete() {
    throw new Error('confirmDelete must be implemented by subclass');
  }

  confirmVisibilityChange() {
    throw new Error('confirmVisibilityChange must be implemented by subclass');
  }
}

export default BaseGroupedStore;