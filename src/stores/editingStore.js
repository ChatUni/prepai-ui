import { uploadImage } from '../utils/uploadHelper';
import { t } from './languageStore';

class EditingStore {
  editingItem = {};
  isDirty = false;
  isEditMode = false;
  isPageMode = false;

  showEditDialog = false;
  toggleConfirmField = '';

  get isCRUD() {
    return true;
  }

  get yesNoOptions() {
    return [
      { value: true, text: t('common.yes') },
      { value: false, text: t('common.no') },
    ];
  }

  setEditingItem = function(item) {
    this.editingItem = { ...(item || this.newItem) };
  };

  getValueByType = function(obj, value) {
    if (typeof value !== 'string') return value;
    const type = typeof obj;
    if (type === 'number') return +value;
    if (type === 'boolean') return value.toLowerCase() === 'true';
    return value;
  };

  setValue = function(object, field, value, index = -1) {
    if (Array.isArray(object[field]) && index > -1) {
      object[field][index] = this.getValueByType(object[field][index], value);
    } else {
      object[field] = this.getValueByType(object[field], value);
    }
    this.isDirty = true;
  };

  setEditingItemField = function(name, value, index = -1) {
    this.setValue(this.editingItem, name, value, index);
  }

  setField = function(name, value, index = -1) {
    this.setValue(this, name, value, index);
  }

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

  validate = async function() { // return a list of error msgs, each validator should return its own error msg
    if (this.validator) {
      const err = await Promise.all(Object.entries(this.validator).map(([k, v]) => {
        const iv = (this.isCRUD ? this.editingItem : this)[k];
        const f = t(`${this.name}.${k}`);
        if (v === 1) {
          if (iv === null || iv === undefined || iv === '') return t('common.required', { name: f });
        } else if (typeof v === 'function') {
          return v(iv);
        }
      })).then(r => r.filter(x => (typeof(x) === 'string' && x !== '') || x === false)); // keep the ones with error msg or === false
      return err;
    }
    return [];
  }

  confirmEdit = async function(isReload = true, isClose = true) { // only for editingItem
    if (!this.editingItem) return;

    const err = await this.validate();
    if (err.length > 0) {
      const msgs = err.filter(x => x);
      if (msgs.length > 0) this.openErrorDialog(msgs);
      return;
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
