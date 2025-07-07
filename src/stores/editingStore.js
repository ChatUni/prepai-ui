class EditingStore {
  editingItem = {};
  isEditMode = false;
  isPageMode = false;

  showEditDialog = false;
  showDeleteDialog = false;
  showRestoreDialog = false;
  showVisibilityDialog = false;

  setEditingItem = function(item) {
    this.editingItem = { ...(item || this.newItem) };
  };

  setEditingField = function(name, value, index = -1) {
    if (Array.isArray(this.editingItem[name]) && index > -1) {
      this.editingItem[name][index] = value;
    } else {
      this.editingItem[name] = value;
    }
  };

  reset = function() {
    this.editingItem = {};
    this.isEditMode = false;
    this.isPageMode = false;
    this.showEditDialog = false;
    this.showDeleteDialog = false;
    this.showRestoreDialog = false;
    this.showVisibilityDialog = false;
  };

  initPageEditing = function(item) {
    this.setEditingItem(item);
    this.isPageMode = true;
    this.isEditMode = item != null;
  };

  exitPageEditing = function() {
    this.isPageMode = false;
    this.editingItem = {};
  };

  openAddDialog = function() {
    this.openEditDialog();
  };

  openEditDialog = function(item) {
    this.setEditingItem(item);
    this.isEditMode = item != null;
    this.isPageMode = false;
    this.showEditDialog = true;
  };

  closeEditDialog = function() {
    this.showEditDialog = false;
    this.editingItem = {};
  };

  openDeleteDialog = function(item) {
    this.editingItem = item;
    this.showDeleteDialog = true;
  };

  closeDeleteDialog = function() {
    this.showDeleteDialog = false;
    this.editingItem = {};
  };

  openRestoreDialog = function(item) {
    this.editingItem = item;
    this.showRestoreDialog = true;
  };

  closeRestoreDialog = function() {
    this.showRestoreDialog = false;
    this.editingItem = {};
  };

  openVisibilityDialog = function(item) {
    this.editingItem = item;
    this.showVisibilityDialog = true;
  };

  closeVisibilityDialog = function() {
    this.showVisibilityDialog = false;
    this.editingItem = {};
  };

  confirmEdit = async function() {
    if (!this.editingItem) return;
    try {
      await this.save(this.editingItem);
      if (this.fetchItems) await this.fetchItems();
    } catch (e) {
      this.openErrorDialog('Error saving item');
    } finally {
      this.closeEditDialog();
    }
  };

  confirmDelete = async function() {
    if (!this.editingItem) return;
    try {
      await this.remove(this.editingItem);
    } catch (e) {
      this.openErrorDialog('Error deleting item');
    } finally {
      this.closeDeleteDialog();
    }
  };

  confirmRestore = async function() {
    if (!this.editingItem) return;
    try {
      await this.toggleField('deleted');
    } catch (e) {
      this.openErrorDialog('Error restoring item');
    } finally {
      this.closeRestoreDialog();
    }
  };

  toggleField = async function(field) {
    if (!this.editingItem) return;
    this.editingItem[field] = !this.editingItem[field];
    try {
      await this.save(this.editingItem);
    } catch (e) {
      this.openErrorDialog('Error toggle field');
    } finally {
      this.closeVisibilityDialog();
    }
  };

  confirmToggleDelete = async function() {
    await this.toggleField('deleted');
  };

  confirmToggleVisibility = async function() {
    await this.toggleField('hidden');
  };
}

export default EditingStore;