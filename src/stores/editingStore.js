import { uploadImage } from '../utils/uploadHelper';
import { t } from './languageStore';

class EditingStore {
  editingItem = {};
  isDirty = false;
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
    this.isDirty = true;
  };

  reset = function() {
    this.editingItem = {};
    this.isDirty = false;
    this.isEditMode = false;
    this.isPageMode = false;
    this.showEditDialog = false;
    this.showDeleteDialog = false;
    this.showRestoreDialog = false;
    this.showVisibilityDialog = false;
  };

  initPageEditing = function(item) {
    this.setEditingItem(item);
    this.isDirty = false;
    this.isPageMode = true;
    this.isEditMode = item != null;
  };

  exitPageEditing = function() {
    this.isPageMode = false;
    this.editingItem = {};
    this.isDirty = false;
  };

  openAddDialog = function() {
    this.openEditDialog();
  };

  openEditDialog = function(item) {
    this.setEditingItem(item);
    this.isDirty = false;
    this.isEditMode = item != null;
    this.isPageMode = false;
    this.showEditDialog = true;
  };

  closeEditDialog = function() {
    this.showEditDialog = false;
    this.editingItem = {};
    this.isDirty = false;
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

  confirmEdit = async function(isReload = true, isClose = true) {
    if (!this.editingItem) return;

    if (this.validator) {
      const err = Object.entries(this.validator).map(([k, v]) => {
        const iv = this.editingItem[k];
        const f = t(`${this.name}.${k}`);
        if (v === 1) {
          if (iv === null || iv === undefined || iv === '') return t('common.required', { name: f });
        } else if (typeof v === 'function') {
          return v(iv);
        }
      }).filter(x => x);
      if (err.length > 0) {
        this.openErrorDialog(err);
        return;
      }
    }

    try {
      await this.saveItem(this.editingItem);
      if (isReload && this.fetchItems) await this.fetchItems(true);
      this.isDirty = false;
    } catch (e) {
      console.log(e);
      this.openErrorDialog('Error saving item');
    } finally {
      isClose && this.closeEditDialog();
    }
  };

  saveItem = async function(item = this.editingItem || {}) {
    let dirty = true;

    if (!item.id) {
      const data = await this.save(item);
      item.id = data[0].id;
      dirty = false;
    }

    if (this.mediaInfo) {
      for (const k of Object.keys(this.mediaInfo)) {
        if (item[k] instanceof File) {
          const url = await uploadImage(item[k], this.mediaInfo[k](item));
          item[k] = url;
          dirty = true;
        }
      }
    }

    dirty && await this.save(item);
  }
  
  confirmDelete = async function() {
    if (!this.editingItem) return;
    try {
      await this.remove(this.editingItem.id);
      if (this.fetchItems) await this.fetchItems(true);
    } catch (e) {
      console.log(e)
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