import { uploadImage } from '../utils/uploadHelper';
import { t } from './languageStore';

class EditingStore {
  editingItem = {};
  isDirty = false;
  isEditMode = false;
  isPageMode = false;

  showEditDialog = false;
  toggleConfirmField = '';

  get yesNoOptions() {
    return [
      { value: true, text: t('common.yes') },
      { value: false, text: t('common.no') },
    ];
  }

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
    this.toggleConfirmField = '';
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
    this.openConfirmDialog('deleted');
  };

  closeDeleteDialog = function() {
    this.closeConfirmDialog();
    this.editingItem = {};
  };

  openToggleConfirmDialog = function(item, field) {
    this.editingItem = item;
    this.toggleConfirmField = field;
  };

  closeToggleConfirmDialog = function() {
    this.toggleConfirmField = '';
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
          const key = await this.mediaInfo[k](item);
          const url = await uploadImage(item[k], key);
          item[k] = url;
          dirty = true;
        }
      }
    }

    dirty && await this.save(item);
  }
  
  confirmDeleted = async function() {
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

  confirmToggle = async function(field) {
    if (!this.editingItem) return;
    this.editingItem[field] = !this.editingItem[field];
    try {
      await this.save(this.editingItem);
    } catch (e) {
      this.openErrorDialog('Error toggle field');
    } finally {
      this.closeToggleConfirmDialog();
    }
  };
}

export default EditingStore;
