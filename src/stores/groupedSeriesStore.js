import { makeAutoObservable } from 'mobx';
import clientStore from './clientStore';
import routeStore from './routeStore';
import seriesStore from './seriesStore';
import editSeriesStore from './editSeriesStore';
import languageStore from './languageStore';
import { save } from '../utils/db';
import _ from 'lodash';

class GroupedSeriesStore {
  expandedGroups = new Set();
  pendingGroupOrder = null;
  isAddGroupDialogOpen = false;
  isEditGroupDialogOpen = false;
  isDeleteGroupDialogOpen = false;
  isErrorDialogOpen = false;
  isEditSeriesDialogOpen = false;
  newGroupName = '';
  selectedGroup = null;
  errorMessage = '';

  constructor() {
    makeAutoObservable(this);
  }

  openEditGroupDialog = (group) => {
    this.selectedGroup = group;
    this.newGroupName = group;
    this.isEditGroupDialogOpen = true;
  };

  closeEditGroupDialog = () => {
    this.isEditGroupDialogOpen = false;
    this.newGroupName = '';
    this.selectedGroup = null;
  };

  handleDeleteGroup = (group) => {
    if (this.canDeleteGroup(group)) {
      this.selectedGroup = group;
      this.isDeleteGroupDialogOpen = true;
    } else {
      this.showErrorDialog(languageStore.t('series.groups.cannotDelete'));
    }
  };

  closeDeleteGroupDialog = () => {
    this.isDeleteGroupDialogOpen = false;
    this.selectedGroup = null;
  };

  showErrorDialog = (message) => {
    this.errorMessage = message;
    this.isErrorDialogOpen = true;
  };

  closeErrorDialog = () => {
    this.isErrorDialogOpen = false;
    this.errorMessage = '';
  };

  canDeleteGroup = (group) => {
    return !seriesStore.groupedSeries[group]?.length;
  };

  openAddGroupDialog = () => {
    this.isAddGroupDialogOpen = true;
  };

  closeAddGroupDialog = () => {
    this.isAddGroupDialogOpen = false;
    this.newGroupName = '';
  };

  openEditSeriesDialog = (series) => {
    editSeriesStore.reset(series);
    this.isEditSeriesDialogOpen = true;
  };

  closeEditSeriesDialog = () => {
    this.isEditSeriesDialogOpen = false;
    this.selectedGroup = null;
    // Clear series state when closing dialog
    routeStore.setSeriesId(null);
    editSeriesStore.reset(null);
  };

  setNewGroupName = (name) => {
    this.newGroupName = name;
  };

  addGroup = async (groupName) => {
    const nameToUse = groupName || this.newGroupName;
    if (!nameToUse.trim()) return;

    try {
      const groups = [...clientStore.client.settings.groups, nameToUse];
      clientStore.client.settings.groups = groups;
      seriesStore.setGroupOrder(groups);

      await clientStore.save();
      this.closeAddGroupDialog();
    } catch (error) {
      console.error('Failed to add group:', error);
      throw error;
    }
  };

  editGroup = async (oldGroupName, newGroupName) => {
    const oldName = oldGroupName || this.selectedGroup;
    const newName = newGroupName || this.newGroupName;
    if (!newName.trim() || !oldName) return;

    try {
      const groups = [...clientStore.client.settings.groups];
      const index = groups.indexOf(oldName);
      if (index !== -1) {
        groups[index] = newName;
        clientStore.client.settings.groups = groups;
        seriesStore.setGroupOrder(groups);

        // Update group name in series
        const seriesList = [...seriesStore.series];
        seriesList.forEach(series => {
          if (series.group === oldName) {
            series.group = newName;
          }
        });
        seriesStore.setSeries(seriesList);

        await Promise.all([
          clientStore.save(),
          ...seriesList
            .filter(series => series.group === newName)
            .map(series => save('series', _.omit(series, ['courses'])))
        ]);

        this.closeEditGroupDialog();
      }
    } catch (error) {
      console.error('Failed to edit group:', error);
      throw error;
    }
  };

  deleteGroup = async (groupName) => {
    const nameToDelete = groupName || this.selectedGroup;
    if (!nameToDelete || !this.canDeleteGroup(nameToDelete)) return;

    try {
      const groups = clientStore.client.settings.groups.filter(g => g !== nameToDelete);
      clientStore.client.settings.groups = groups;
      seriesStore.setGroupOrder(groups);

      await clientStore.save();
      this.closeDeleteGroupDialog();
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  };

  toggleGroup = (group) => {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  };

  moveGroup = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    console.log('Moving group from', fromIndex, 'to', toIndex);
    seriesStore.moveGroup(fromIndex, toIndex);
  };

  // Called during drag
  moveSeriesInGroup = (group, fromIndex, toIndex) => {
    if (!seriesStore.groupedSeries) return null;
    return seriesStore.moveSeries(group, fromIndex, toIndex);
  };

  isGroupExpanded = (group) => {
    return this.expandedGroups.has(group);
  };
}

const groupedSeriesStore = new GroupedSeriesStore();
export default groupedSeriesStore;