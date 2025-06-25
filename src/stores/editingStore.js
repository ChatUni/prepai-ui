class EditingStore {
  editingItem = {};
  isEditMode = false;

  showEditDialog = false;
  showDeleteDialog = false;
  showVisibilityDialog = false;

  setEditingItem = function(item) {
    this.editingItem = { ...item };
  };

  setEditingField = function(name, value) {
    this.editingItem[name] = value;
  };

  // Dialog management methods
  openAddDialog = function() {
    this.openEditDialog();
  };

  openEditDialog = function(item) {
    this.editingItem = item || this.newItem;
    this.isEditMode = item != null;
    this.showEditDialog = true;
  };

  closeEditDialog = function() {
    this.showEditDialog = false;
    this.editingItem = null;
  };

  openDeleteDialog = function(item) {
    this.editingItem = item;
    this.showDeleteDialog = true;
  };

  closeDeleteDialog = function() {
    this.showDeleteDialog = false;
    this.editingItem = null;
  };

  openVisibilityDialog = function(item) {
    this.editingItem = item;
    this.showVisibilityDialog = true;
  };

  closeVisibilityDialog = function() {
    this.showVisibilityDialog = false;
    this.editingItem = null;
  };

  confirmEdit = async function() {
    if (!this.editingItem) return;
    try {
      await this.save(this.editingItem);
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