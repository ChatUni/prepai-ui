// Utility functions for grouped stores to avoid inheritance issues with MobX
import { createBaseCardStoreMethods } from './baseCardStoreUtils';

export const createGroupedStoreMethods = () => ({
  // Mix in base card store methods for consistent interface
  ...createBaseCardStoreMethods(),
  
  // UI state
  expandedGroups: new Set(),
  
  // Group ordering
  groupOrder: [],
  pendingGroups: null,

  // Group expansion methods
  isGroupExpanded: function(group) {
    return this.expandedGroups.has(group);
  },

  toggleGroup: function(group) {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  },

  // Group ordering methods
  moveGroup: function(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    const groups = this.groupOrder.length > 0
      ? [...this.groupOrder]
      : Object.keys(this.getGroupedItems());

    const [removed] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, removed);
    
    this.groupOrder = groups;
    this.pendingGroups = groups;
  },

  // Legacy methods for backward compatibility - delegate to base methods
  setShowDeleteDialog: function(show) {
    this.showDeleteDialog = show;
  },

  setItemToDelete: function(item) {
    this.itemToDelete = item;
  }

  // Note: Other dialog methods are now provided by createBaseCardStoreMethods()
});