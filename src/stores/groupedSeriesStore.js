import { makeObservable, computed } from 'mobx';
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
    makeObservable(this, {
      expandedGroups: true,
      pendingGroupOrder: true,
      isAddGroupDialogOpen: true,
      isEditGroupDialogOpen: true,
      isDeleteGroupDialogOpen: true,
      isErrorDialogOpen: true,
      isEditSeriesDialogOpen: true,
      newGroupName: true,
      selectedGroup: true,
      errorMessage: true,
    });
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

  addGroup = async () => {
    if (!this.newGroupName.trim()) return;

    try {
      const groups = [...clientStore.client.settings.groups, this.newGroupName];
      clientStore.client.settings.groups = groups;
      seriesStore.setGroupOrder(groups);

      await fetch('/api/save?doc=clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientStore.client)
      });

      this.closeAddGroupDialog();
    } catch (error) {
      console.error('Failed to add group:', error);
      throw error;
    }
  };

  editGroup = async () => {
    if (!this.newGroupName.trim() || !this.selectedGroup) return;

    try {
      const groups = [...clientStore.client.settings.groups];
      const index = groups.indexOf(this.selectedGroup);
      if (index !== -1) {
        groups[index] = this.newGroupName;
        clientStore.client.settings.groups = groups;
        seriesStore.setGroupOrder(groups);

        // Update group name in series
        const seriesList = [...seriesStore.series];
        seriesList.forEach(series => {
          if (series.group === this.selectedGroup) {
            series.group = this.newGroupName;
          }
        });
        seriesStore.setSeries(seriesList);

        await Promise.all([
          save('clients', clientStore.client),
          ...seriesList
            .filter(series => series.group === this.newGroupName)
            .map(series => save('series', _.omit(series, ['courses'])))
        ]);

        this.closeEditGroupDialog();
      }
    } catch (error) {
      console.error('Failed to edit group:', error);
      throw error;
    }
  };

  deleteGroup = async () => {
    if (!this.selectedGroup || !this.canDeleteGroup(this.selectedGroup)) return;

    try {
      const groups = clientStore.client.settings.groups.filter(g => g !== this.selectedGroup);
      clientStore.client.settings.groups = groups;
      seriesStore.setGroupOrder(groups);

      await fetch('/api/save?doc=clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientStore.client)
      });

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