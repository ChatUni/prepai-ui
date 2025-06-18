// Utility functions for BaseCard stores to provide consistent interface
// Uses composition instead of inheritance to avoid MobX observable issues

export const createBaseCardStoreMethods = () => ({
  // Dialog states - consistent interface for BaseCard
  showDeleteDialog: false,
  showVisibilityDialog: false,
  showEditDialog: false,
  itemToDelete: null,
  // Note: currentItem is not included here to avoid conflicts with getter properties
  // Stores should provide their own currentItem property or getter

  // Base dialog methods
  openDeleteDialog: function(item) {
    this.currentItem = item;
    this.itemToDelete = item;
    this.showDeleteDialog = true;
  },

  closeDeleteDialog: function() {
    this.showDeleteDialog = false;
    this.currentItem = null;
    this.itemToDelete = null;
  },

  openVisibilityDialog: function(item) {
    this.currentItem = item;
    this.showVisibilityDialog = true;
  },

  closeVisibilityDialog: function() {
    this.showVisibilityDialog = false;
    this.currentItem = null;
  },

  openEditDialog: function(item) {
    this.currentItem = item;
    this.showEditDialog = true;
  },

  closeEditDialog: function() {
    this.showEditDialog = false;
    this.currentItem = null;
  },

  // Standard handler methods that BaseCard expects
  handleToggleVisibility: function(item) {
    this.openVisibilityDialog(item);
  },

  handleEdit: function(item) {
    this.openEditDialog(item);
  },

  handleDelete: function(item) {
    if (item.deleted) {
      // Handle restore logic - stores can override this
      this.handleRestore?.(item);
    } else {
      this.openDeleteDialog(item);
    }
  },

  // Default implementations - stores should override these
  confirmDelete: function() {
    console.warn('confirmDelete not implemented in store');
    this.closeDeleteDialog();
  },

  confirmVisibilityChange: function() {
    console.warn('confirmVisibilityChange not implemented in store');
    this.closeVisibilityDialog();
  },

  saveItem: function() {
    console.warn('saveItem not implemented in store');
    this.closeEditDialog();
  }
});

// Helper function to create a consistent interface adapter
// This maps store-specific properties to the BaseCard expected interface
export const createBaseCardAdapter = (store, config = {}) => {
  const {
    // Map store-specific current item property to currentItem
    currentItemProperty = 'currentItem',
    // Map store-specific save method
    saveMethod = 'saveItem',
    // Additional method mappings
    methodMappings = {}
  } = config;

  return {
    // Proxy currentItem to the store's specific property
    get currentItem() {
      return store[currentItemProperty] || store.currentItem;
    },

    // Proxy all dialog states
    get showDeleteDialog() { return store.showDeleteDialog; },
    get showVisibilityDialog() { return store.showVisibilityDialog; },
    get showEditDialog() { return store.showEditDialog; },
    get itemToDelete() { return store.itemToDelete; },

    // Proxy all dialog methods
    closeDeleteDialog: () => store.closeDeleteDialog(),
    closeVisibilityDialog: () => store.closeVisibilityDialog(),
    closeEditDialog: () => store.closeEditDialog(),
    confirmDelete: () => store.confirmDelete(),
    confirmVisibilityChange: () => store.confirmVisibilityChange(),

    // Proxy save method with fallback
    [saveMethod]: () => store[saveMethod]?.() || store.saveItem?.(),
    saveAssistant: () => store.saveAssistant?.() || store.saveItem?.(),

    // Apply any additional method mappings
    ...Object.keys(methodMappings).reduce((acc, key) => {
      acc[key] = () => store[methodMappings[key]]();
      return acc;
    }, {})
  };
};

// CommonJS exports for Node.js compatibility (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBaseCardStoreMethods,
    createBaseCardAdapter
  };
}