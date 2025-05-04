import { makeAutoObservable, runInAction } from 'mobx';
import coursesStore from './coursesStore';

class GroupedSeriesStore {
  expandedGroups = new Set();
  pendingGroupOrder = null;

  constructor() {
    makeAutoObservable(this);
  }

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