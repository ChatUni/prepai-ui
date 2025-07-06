import { observable } from 'mobx';
import { save } from '../utils/db';
import clientStore from './clientStore';
import { t } from './languageStore';

class GroupedListStore {
  expandedGroups = observable.set();
  groupOrder = [];
  pendingGroups = null;
  isAddGroupDialogOpen = false;
  isEditGroupDialogOpen = false;
  isDeleteGroupDialogOpen = false;
  newGroupName = '';
  groupToEdit = null;
  groupToDelete = null;

  get groupedItems() {
    return this.getGroupedItems();
  }

  get groupOptions() {
    return (clientStore.client.settings[`${this.name}Groups`] || []).map(group => ({
      value: group,
      label: group
    }));
  }

  // Group expansion methods
  isGroupExpanded = function(group) {
    return this.expandedGroups.has(group);
  };

  toggleGroup = function(group) {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  };

  // Group ordering methods
  moveGroup = function(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    const groups = this.pendingGroups || this.getGroups();

    const [removed] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, removed);
    
    this.pendingGroups = groups;
  };

  // Set group order from external source
  setGroupOrder = function(groupOrder) {
    this.groupOrder = groupOrder;
  };

  // Add group dialog methods
  openAddGroupDialog = function() {
    this.newGroupName = '';
    this.isAddGroupDialogOpen = true;
  };

  closeAddGroupDialog = function() {
    this.isAddGroupDialogOpen = false;
    this.newGroupName = '';
  };

  // Edit group dialog methods
  openEditGroupDialog = function(group) {
    this.groupToEdit = group;
    this.newGroupName = group;
    this.isEditGroupDialogOpen = true;
  };

  closeEditGroupDialog = function() {
    this.isEditGroupDialogOpen = false;
    this.groupToEdit = null;
    this.newGroupName = '';
  };

  // Delete group dialog methods
  openDeleteGroupDialog = function(group) {
    if (this.canDeleteGroup(group)) {
      this.groupToDelete = group;
      this.isDeleteGroupDialogOpen = true;
    } else {
      this.openErrorDialog(t(`${this.name}.groups.cannotDelete`));
    }
  };

  closeDeleteGroupDialog = function() {
    this.isDeleteGroupDialogOpen = false;
    this.groupToDelete = null;
  };

  // Set new group name
  setNewGroupName = function(name) {
    this.newGroupName = name;
  };

  // Group management actions
  handleAddGroup = async function() {
    if (!this.newGroupName.trim()) return;

    try {
      await this.addGroup(this.newGroupName.trim());
      this.closeAddGroupDialog();
    } catch (error) {
      console.error('Error adding group:', error);
      this.openErrorDialog('Failed to add group');
    }
  };

  handleEditGroup = async function() {
    if (!this.newGroupName.trim() || !this.groupToEdit) return;

    try {
      await this.editGroup(this.groupToEdit, this.newGroupName.trim());
      this.closeEditGroupDialog();
    } catch (error) {
      console.error('Error editing group:', error);
      this.openErrorDialog('Failed to edit group');
    }
  };

  handleDeleteGroup = async function() {
    if (!this.groupToDelete) return;

    try {
      await this.deleteGroup(this.groupToDelete);
      this.closeDeleteGroupDialog();
    } catch (error) {
      console.error('Error deleting group:', error);
      this.openErrorDialog('Failed to delete group');
    }
  };

  // Check if group can be deleted (has no items)
  canDeleteGroup = function(group) {
    const groups = this.getGroupedItems();
    const groupItems = groups[group] || [];
    return groupItems.length === 0;
  };

  getGroups = function(isFiltered) {
    const groupsInSettings = clientStore.client?.settings?.[`${this.name}Groups`] || [];
    const hasGroupsInSettings = groupsInSettings || groupsInSettings.length > 0;
    if (!isFiltered && hasGroupsInSettings)
      return groupsInSettings;
    else
      return [...new Set(this[isFiltered ? 'filteredItems' : 'items'].map(item => item.group || 'Default'))];
  }

  saveGroups = async function(groups) {
    clientStore.client.settings[`${this.name}Groups`] = groups;
    try {
      await clientStore.save();
    } catch (error) {
      console.error('Error saving groups:', error);
      throw error;
    }
  };

  saveGroupOrder = async function() {
    if (!this.pendingGroups) return;
    
    try {
      await this.saveGroups(this.pendingGroups);
      this.groupOrder = [...this.pendingGroups];
      this.pendingGroups = null;
    } catch (error) {
      console.error('Error saving group order:', error);
      throw error;
    }
  };

  getGroupedItems = function() {
    if (!this.filteredItems) {
      return {};
    }

    const items = this.filteredItems;
    const groups = this.getGroups();

    if (groups.length === 0) return items;

    const grouped = {};

    groups.forEach(group => {
      const groupItems = items.filter(item => !item.deleted && (item.group || 'Default') === group);
      
      // Ensure each item has an order property
      groupItems.forEach((item, index) => {
        if (typeof item.order !== 'number') {
          item.order = index;
        }
      });
      
      // Sort by order property
      grouped[group] = groupItems.sort((a, b) => a.order - b.order);
    });

    if (this.isAdminMode) {
      const deletedItems = items.filter(item => item.deleted);
      if (deletedItems.length > 0)
        grouped[t('series.groups.recycle')] = deletedItems;
    }

    return grouped;
  };

  addGroup = async function(groupName) {
    if (!groupName || !groupName.trim()) return;
    await this.saveGroups([...this.getGroups(), groupName.trim()]);
  };

  editGroup = async function(oldGroupName, newGroupName) {
    if (!newGroupName || !newGroupName.trim() || !oldGroupName) return;

    try {
      const trimmedNewName = newGroupName.trim();
      const updatedItems = this.items.filter(item => item.group === oldGroupName).map(item => ({
        ...item,
        group: trimmedNewName
      }));
      const updatedGroups = this.getGroups().map(group =>
        group === oldGroupName ? trimmedNewName : group
      );

      const savePromises = [
        this.saveGroups(updatedGroups),
        ...updatedItems.map(item => this.save(item))
      ];
      await Promise.all(savePromises);
      await this.fetchItems();
    } catch (error) {
      console.error('Error editing group:', error);
      throw error;
    }
  };

  deleteGroup = async function(groupName) {
    if (!groupName) return;
    await this.saveGroups(this.getGroups().filter(group => group !== groupName));
  };

  saveItemGroupOrder = async function() {
    try {
      const itemType = this.constructor.name.replace('Store', '').toLowerCase();
      // Save the current state of items with their updated positions
      await save(itemType, this.items);
      await this.fetchItems();
    } catch (error) {
      console.error('Error saving item group order:', error);
    }
  };

  moveItemInGroup = function(group, fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const currentGroupItems = [...this.getGroupedItems()[group]];
    
    const [movedItem] = currentGroupItems.splice(fromIndex, 1);
    currentGroupItems.splice(toIndex, 0, movedItem);

    // Update order property for each item in the group
    currentGroupItems.forEach((item, index) => {
      item.order = index;
    });

    // Update the main items array
    const itemsList = [...this.items];
    currentGroupItems.forEach(item => {
      const itemIndex = itemsList.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        itemsList[itemIndex] = {
          ...itemsList[itemIndex],
          order: item.order
        };
      }
    });
  };

  isGroupEditable = function(group) {
    return this.isAdminMode && (!this.isGroupDanger || !this.isGroupDanger(group));
  }

  // Reset all state
  reset = function() {
    this.expandedGroups.clear();
    this.groupOrder = [];
    this.pendingGroups = null;
    this.isAddGroupDialogOpen = false;
    this.isEditGroupDialogOpen = false;
    this.isDeleteGroupDialogOpen = false;
    this.newGroupName = '';
    this.groupToEdit = null;
    this.groupToDelete = null;
  };
}

export default GroupedListStore;