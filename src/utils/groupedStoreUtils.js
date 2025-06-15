// Utility functions for grouped stores to avoid inheritance issues with MobX

export const createGroupedStoreMethods = () => ({
  // UI state
  expandedGroups: new Set(),
  
  // Group ordering
  groupOrder: [],
  pendingGroups: null,

  // Dialog states
  showDeleteDialog: false,
  itemToDelete: null,
  showVisibilityDialog: false,
  currentItem: null,

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

  // Dialog state methods
  setShowDeleteDialog: function(show) {
    this.showDeleteDialog = show;
  },

  setItemToDelete: function(item) {
    this.itemToDelete = item;
  },

  closeDeleteDialog: function() {
    this.setShowDeleteDialog(false);
    this.setItemToDelete(null);
  },

  openVisibilityDialog: function(item) {
    this.currentItem = item;
    this.showVisibilityDialog = true;
  },

  closeVisibilityDialog: function() {
    this.showVisibilityDialog = false;
    this.currentItem = null;
  },

  handleToggleVisibility: function(item) {
    this.openVisibilityDialog(item);
  },

  handleDelete: function(item) {
    this.setItemToDelete(item);
    this.setShowDeleteDialog(true);
  }
});