import { makeAutoObservable, computed } from 'mobx';
import routeStore from './routeStore';
import languageStore from './languageStore';
import seriesStore from './seriesStore';
import groupedSeriesStore from './groupedSeriesStore';
import editCourseStore from './editCourseStore';
import editInstructorStore from './editInstructorStore';
import editSeriesStore from './editSeriesStore';
import { createBaseCardStoreMethods } from '../utils/baseCardStoreUtils';

class SeriesCardStore {
  expandedSeriesId = null;
  editInstructorDialogOpen = false;
  currentEditInstructor = null;
  showRestoreDialog = false;
  currentSeries = null;
  currentItem = null; // Add explicit property to avoid getter conflicts

  constructor() {
    // Mix in base card store methods
    Object.assign(this, createBaseCardStoreMethods());
    
    makeAutoObservable(this);
  }

  openEditInstructorDialog = (instructor) => {
    this.currentEditInstructor = instructor;
    editInstructorStore.reset(instructor);
    this.editInstructorDialogOpen = true;
  };

  closeEditInstructorDialog = () => {
    this.editInstructorDialogOpen = false;
    this.currentEditInstructor = null;
  };

  toggleCourseList = (seriesId) => {
    if (this.expandedSeriesId === seriesId) {
      this.expandedSeriesId = null;
    } else {
      this.expandedSeriesId = seriesId;
    }
  };

  isExpanded = (seriesId) => {
    return this.expandedSeriesId === seriesId;
  };

  validateSeries = (series) => {
    if (!series || typeof series !== 'object') {
      console.error('Invalid series object:', series);
      return null;
    }

    const seriesId = series.id;
    if (!seriesId) {
      console.error('Series missing ID:', series);
      return null;
    }

    return {
      id: seriesId,
      name: typeof series.name === 'string' ? series.name : '',
      desc: typeof series.desc === 'string' ? series.desc : '',
      cover: typeof series.cover === 'string' ? series.cover : '',
      group: series.group,
      price: +series.price || 0
    };
  };

  getImage = (cover) => {
    return cover || 'https://via.placeholder.com/300x200?text=Series';
  };

  handleSeriesClick = (seriesId, navigate, e) => {
    if (e) e.stopPropagation();
    
    if (routeStore.isSeriesSelectMode) {
      navigate(`/series/${seriesId}/edit`);
    } else if (routeStore.isSeriesExamMode) {
      navigate(`/exam/questions/1`);
    } else {
      routeStore.navigateToSeries(seriesId, navigate);
    }
  };

  get unknownInstructorText() {
    return languageStore.t('series.unknownInstructor');
  }

  getCourseCountText = (count, seriesId) => {
    const key = this.isExpanded(seriesId) ? 'series.hideCourses' : 'series.showCourses';
    return languageStore.t(key, { count });
  };

  openEditDialog = (series) => {
    routeStore.setSeriesId(series.id);
    editSeriesStore.reset(series);
    groupedSeriesStore.openEditSeriesDialog(series);
  };

  // Override base methods to sync currentSeries and currentItem
  openVisibilityDialog = (series) => {
    this.currentSeries = series;
    this.currentItem = series;
    this.showVisibilityDialog = true;
  };

  closeVisibilityDialog = () => {
    this.showVisibilityDialog = false;
    this.currentSeries = null;
    this.currentItem = null;
  };

  openDeleteDialog = (series) => {
    this.currentSeries = series;
    this.currentItem = series;
    this.itemToDelete = series;
    this.showDeleteDialog = true;
  };

  closeDeleteDialog = () => {
    this.showDeleteDialog = false;
    this.currentSeries = null;
    this.currentItem = null;
    this.itemToDelete = null;
  };

  openRestoreDialog = (series) => {
    this.currentSeries = series;
    this.showRestoreDialog = true;
  };

  closeRestoreDialog = () => {
    this.showRestoreDialog = false;
    this.currentSeries = null;
  };

  // Override base implementations with series-specific logic
  confirmVisibilityChange = () => {
    if (this.currentSeries) {
      seriesStore.toggleSeriesVisibility(this.currentSeries.id);
      this.closeVisibilityDialog();
    }
  };

  confirmDelete = () => {
    if (this.currentSeries) {
      seriesStore.deleteSeries(this.currentSeries.id);
      this.closeDeleteDialog();
    }
  };

  confirmRestore = () => {
    if (this.currentSeries) {
      seriesStore.deleteSeries(this.currentSeries.id, true);
      this.closeRestoreDialog();
    }
  };

  // Override base handlers to use series-specific logic
  handleToggleVisibility = (series) => {
    this.openVisibilityDialog(series);
  };

  handleEdit = (series) => {
    this.openEditDialog(series);
  };

  handleDelete = (series) => {
    if (series.deleted) {
      this.openRestoreDialog(series);
    } else {
      this.openDeleteDialog(series);
    }
  };

  handleRestore = (series) => {
    this.openRestoreDialog(series);
  };

  // Series-specific edit dialog handling
  openEditDialog = (series) => {
    this.currentSeries = series;
    this.currentItem = series;
    this.showEditDialog = true;
    routeStore.setSeriesId(series.id);
    editSeriesStore.reset(series);
    groupedSeriesStore.openEditSeriesDialog(series);
  };

  closeEditDialog = () => {
    this.showEditDialog = false;
    this.currentSeries = null;
    this.currentItem = null;
  };
}

const seriesCardStore = new SeriesCardStore();
export default seriesCardStore;