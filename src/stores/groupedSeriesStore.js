import { makeAutoObservable, runInAction } from 'mobx';
import coursesStore from './coursesStore';
import clientStore from './clientStore';

class GroupedSeriesStore {
  expandedGroups = new Set();
  pendingGroupOrder = null;
  isAddGroupDialogOpen = false;
  isEditGroupDialogOpen = false;
  isDeleteGroupDialogOpen = false;
  isErrorDialogOpen = false;
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

  openDeleteGroupDialog = (group) => {
    this.selectedGroup = group;
    this.isDeleteGroupDialogOpen = true;
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
    return !coursesStore.groupedSeries[group]?.length;
  };

  openAddGroupDialog = () => {
    this.isAddGroupDialogOpen = true;
  };

  closeAddGroupDialog = () => {
    this.isAddGroupDialogOpen = false;
    this.newGroupName = '';
  };

  setNewGroupName = (name) => {
    this.newGroupName = name;
  };

  addGroup = async () => {
    if (!this.newGroupName.trim()) return;

    try {
      const groups = [...clientStore.client.settings.groups, this.newGroupName];
      clientStore.client.settings.groups = groups;
      coursesStore.setGroupOrder(groups);

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
        coursesStore.setGroupOrder(groups);

        // Update group name in series
        const seriesList = [...coursesStore.series];
        seriesList.forEach(series => {
          if (series.group === this.selectedGroup) {
            series.group = this.newGroupName;
          }
        });
        coursesStore.setSeries(seriesList);

        await Promise.all([
          fetch('/api/save?doc=clients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(clientStore.client)
          }),
          ...seriesList
            .filter(series => series.group === this.newGroupName)
            .map(series =>
              fetch('/api/save?doc=series', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(series)
              })
            )
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
      coursesStore.setGroupOrder(groups);

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
    coursesStore.moveGroup(fromIndex, toIndex);
  };

  // Called during drag
  moveSeriesInGroup = (group, fromIndex, toIndex) => {
    if (!coursesStore.groupedSeries) return null;
    return coursesStore.moveSeries(group, fromIndex, toIndex);
  };

  get groupEntries() {
    return Object.entries(coursesStore.groupedSeries || {});
  }

  isGroupExpanded = (group) => {
    return this.expandedGroups.has(group);
  };
}

const groupedSeriesStore = new GroupedSeriesStore();
export default groupedSeriesStore;