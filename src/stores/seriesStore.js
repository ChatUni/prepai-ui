import { makeObservable, runInAction, computed } from 'mobx';
import routeStore from './routeStore';
import uiStore from './uiStore';
import languageStore from './languageStore';
import clientStore from './clientStore';
import editSeriesStore from './editSeriesStore';
import { get, save } from '../utils/db';
import _ from 'lodash';

class SeriesStore {
  series = [];
  instructors = [];
  isLoading = false;
  error = null;
  pendingGroups = null;
  groupOrder = [];
  pendingSeriesUpdates = new Map();

  constructor() {
    makeObservable(this, {
      series: true,
      instructors: true,
      isLoading: true,
      error: true,
      pendingGroups: true,
      groupOrder: true,
      pendingSeriesUpdates: true,
      uniqueCategories: computed,
      currentSeriesFromRoute: computed,
      filteredSeriesCourses: computed,
      seriesInstructors: computed,
      groupedSeries: computed,
      isSeriesValid: computed,
      validSeriesItems: computed,
      filteredSeries: computed
    });
  }

  get uniqueCategories() {
    return [...new Set(seriesStore.series.map(s => s.category))].filter(Boolean);
  }

  setSeries = (series) => {
    this.series = series;
  }

  fetchSeries = async () => {
    try {
      this.isLoading = true;
      await this.fetchInstructors();
      const data = await get('series', { clientId: clientStore.client.id });
      runInAction(() => {
        this.series = data.map((s, index) => ({
          ...s,
          order: typeof s.order === 'number' ? s.order : index
        }));
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  fetchSeriesById = async (id) => {
    if (!id) {
      console.warn('Attempted to fetch series with undefined ID');
      return;
    }

    try {
      this.isLoading = true;
      
      await this.fetchInstructors();
      const data = await get(`series/${id}`);
      
      if (!data || !data[0]) {
        throw new Error('Series not found');
      }

      const series = data[0];
      
      runInAction(() => {
        editSeriesStore.reset(series);
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  fetchInstructors = async () => {
    try {
      this.isLoading = true;
      const data = await get('instructors', { clientId: clientStore.client.id });
      runInAction(() => {
        this.instructors = data;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  handleSubmit = async (form, navigate) => {
    try {
      const savedSeries = await editSeriesStore.saveSeries();
      if (savedSeries) {
        routeStore.navigateToSeries(savedSeries.id, navigate);
      }
      return true;
    } catch (error) {
      console.error('Failed to save series:', error);
      return false;
    }
  }

  get currentSeriesFromRoute() {
    return routeStore.currentSeries;
  }

  get isSeriesValid() {
    return Array.isArray(this.series);
  }

  get validSeriesItems() {
    if (!this.isSeriesValid) return [];
    return this.series.filter(series => series && typeof series === 'object' && !series.deleted);
  }

  get deletedSeries() {
    return this.series.filter(series => series && typeof series === 'object' && series.deleted);
  }

  get filteredSeries() {
    if (!this.isSeriesValid) return [];
    
    const searchKeyword = (uiStore.searchKeyword || '').toLowerCase();
    const selectedInstructorId = uiStore.selectedInstructorId || null;
    const activeCategory = uiStore.activeCategory || '';
    const isGroupMode = uiStore.activeNavItem === 'group';
    const validGroups = new Set(clientStore.client.settings.groups);
    const isSettingsMode = routeStore.isSeriesSettingMode;
    
    return this.validSeriesItems.filter(series => {
      if (isGroupMode && (!series.group || !validGroups.has(series.group))) {
        return false;
      }

      // Hide series if isHidden is true and not in settings mode
      if (!isSettingsMode && series.isHidden) {
        return false;
      }
      
      const matchesSearch = !searchKeyword ||
        (series.name?.toLowerCase().includes(searchKeyword)) ||
        (series.desc?.toLowerCase().includes(searchKeyword)) ||
        (series.instructor?.name?.toLowerCase().includes(searchKeyword));
      
      const matchesInstructor = selectedInstructorId === null ||
        (series.instructor?.id === selectedInstructorId);

      const matchesCategory = !activeCategory || series.category === activeCategory;
      
      return matchesSearch && matchesInstructor && matchesCategory;
    });
  }

  get filteredSeriesCourses() {
    const currentSeries = this.currentSeriesFromRoute;
    if (!currentSeries) return [];

    return currentSeries.courses.filter(course => {
      const selectedInstructorId = uiStore?.selectedInstructorId;
      const matchesInstructor = !selectedInstructorId ||
        course.instructor_id === selectedInstructorId;
      
      const searchKeyword = uiStore?.searchKeyword?.toLowerCase() || '';
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        (this.getInstructorById(course.instructor_id)?.name.toLowerCase().includes(searchKeyword)) ||
        (course.description && course.description.toLowerCase().includes(searchKeyword));
      
      return matchesInstructor && matchesSearch;
    });
  }

  getInstructorById = (id) => (this.instructors || []).find(instructor => instructor.id === id);

  get seriesInstructors() {
    return this.getSeriesInstructors(this.currentSeriesFromRoute, true);
  }

  getSeriesInstructors = (series, isFiltered) => {
    if (!series) return [];

    const ids = new Set((series.courses || [])
      .map(course => course.instructor_id))

    return [...ids].map(this.getInstructorById);
  }

  handleBackNavigation = () => {
    const currentSeries = this.currentSeriesFromRoute;
    if (currentSeries?.instructor?.id) {
      routeStore.navigateToInstructor(currentSeries.instructor?.id);
    } else {
      routeStore.setSeriesId(null);
    }
  }

  moveSeries = (group, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const currentGroupSeries = [...this.groupedSeries[group]];
    
    const [movedSeries] = currentGroupSeries.splice(fromIndex, 1);
    currentGroupSeries.splice(toIndex, 0, movedSeries);

    currentGroupSeries.forEach((series, index) => {
      series.order = index;
    });

    const seriesList = [...this.series];
    currentGroupSeries.forEach(series => {
      const seriesIndex = seriesList.findIndex(s => s.id === series.id);
      if (seriesIndex !== -1) {
        const updatedSeries = {
          ...seriesList[seriesIndex],
          order: series.order
        };
        seriesList[seriesIndex] = updatedSeries;
        this.pendingSeriesUpdates.set(series.id, updatedSeries);
      }
    });

    this.series = seriesList;
  }

  get groupedSeries() {
    if (!this.isSeriesValid) return {};

    if (this.groupOrder.length === 0) {
      this.groupOrder = [...clientStore.client.settings.groups];
    }

    const groups = this.groupOrder;
    const grouped = {};

    groups.forEach(group => {
      const groupSeries = this.filteredSeries.filter(series => series.group === group);
      
      groupSeries.forEach((series, index) => {
        if (typeof series.order !== 'number') {
          series.order = index;
        }
      });
      
      grouped[group] = groupSeries.sort((a, b) => a.order - b.order);
    });

    return grouped;
  }

  setGroupOrder = (groups) => {
    this.groupOrder = groups;
  };

  moveGroup = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const groups = this.groupOrder.length > 0
      ? [...this.groupOrder]
      : [...clientStore.client.settings.groups];

    const [removed] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, removed);
    
    this.groupOrder = groups;
    this.pendingGroups = groups;
  };

  saveGroupOrder = async () => {
    if (!this.pendingGroups) return;

    try {
      clientStore.client.settings.groups = this.pendingGroups;
      await save('clients', clientStore.client)
      
      this.pendingGroups = null;
    } catch (error) {
      console.error('Failed to save group order:', error);
      throw error;
    }
  };

  saveSeriesUpdates = async () => {
    if (this.pendingSeriesUpdates.size === 0) return;

    try {
      for (const series of this.pendingSeriesUpdates.values()) {
        await save('series', series);
      }
      this.pendingSeriesUpdates.clear();
    } catch (error) {
      console.error('Failed to save series updates:', error);
      throw error;
    }
  };

  toggleSeriesVisibility = async (seriesId) => {
    const series = this.series.find(s => s.id === seriesId);
    if (!series) return;

    const updatedSeries = {
      ...series,
      isHidden: !series.isHidden
    };

    // Update local state
    this.series = this.series.map(s =>
      s.id === seriesId ? updatedSeries : s
    );

    // Save to database
    try {
      await save('series', updatedSeries);
    } catch (error) {
      console.error('Failed to toggle series visibility:', error);
      throw error;
    }
  };
}

const seriesStore = new SeriesStore();
export default seriesStore;