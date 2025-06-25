import { makeAutoObservable } from 'mobx';
import routeStore from './routeStore';
import languageStore from './languageStore';
import seriesStore from './seriesStore';
import groupedSeriesStore from './groupedSeriesStore';
import editCourseStore from './editCourseStore';
import editInstructorStore from './editInstructorStore';
import editSeriesStore from './editSeriesStore';

class SeriesCardStore {
  // Store-specific observable fields
  expandedSeriesId = null;
  editInstructorDialogOpen = false;
  currentEditInstructor = null;
  showRestoreDialog = false;
  currentSeries = null;

  constructor() {
    // Create an instance of GroupCardEditManager for dialog management
    this.cardEditManager = {} //new GroupCardEditManager();
    
    // Override the callback methods
    this.cardEditManager.confirmDelete = this.confirmDelete;
    this.cardEditManager.confirmVisibilityChange = this.confirmVisibilityChange;
    this.cardEditManager.handleRestore = this.handleRestore;
    
    makeAutoObservable(this);
  }

  // Delegate dialog state properties to cardEditManager
  get showDeleteDialog() { return this.cardEditManager.showDeleteDialog; }
  get showVisibilityDialog() { return this.cardEditManager.showVisibilityDialog; }
  get showEditDialog() { return this.cardEditManager.showEditDialog; }
  get itemToDelete() { return this.cardEditManager.itemToDelete; }
  get currentItem() { return this.cardEditManager.currentItem; }

  // Delegate dialog methods to cardEditManager
  openDeleteDialog = (item) => this.cardEditManager.openDeleteDialog(item);
  closeDeleteDialog = () => this.cardEditManager.closeDeleteDialog();
  openVisibilityDialog = (item) => this.cardEditManager.openVisibilityDialog(item);
  closeVisibilityDialog = () => this.cardEditManager.closeVisibilityDialog();
  openEditDialog = (item) => this.cardEditManager.openEditDialog(item);
  closeEditDialog = () => this.cardEditManager.closeEditDialog();
  handleToggleVisibility = (item) => this.cardEditManager.handleToggleVisibility(item);
  handleEdit = (item) => this.cardEditManager.handleEdit(item);
  handleDelete = (item) => this.cardEditManager.handleDelete(item);

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


  // Override methods to sync currentSeries and currentItem
  openVisibilityDialog = (series) => {
    this.cardEditManager.openVisibilityDialog(series);
    this.currentSeries = series;
  };

  closeVisibilityDialog = () => {
    this.cardEditManager.closeVisibilityDialog();
    this.currentSeries = null;
  };

  openDeleteDialog = (series) => {
    this.cardEditManager.openDeleteDialog(series);
    this.currentSeries = series;
  };

  closeDeleteDialog = () => {
    this.cardEditManager.closeDeleteDialog();
    this.currentSeries = null;
  };

  openRestoreDialog = (series) => {
    this.currentSeries = series;
    this.showRestoreDialog = true;
  };

  closeRestoreDialog = () => {
    this.showRestoreDialog = false;
    this.currentSeries = null;
  };

  // Implementation for confirmVisibilityChange callback
  confirmVisibilityChange = () => {
    if (this.currentSeries) {
      seriesStore.toggleSeriesVisibility(this.currentSeries.id);
      this.closeVisibilityDialog();
    }
  };

  // Implementation for confirmDelete callback
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

  // Override handleDelete to use series-specific logic
  handleDelete = (series) => {
    if (series.deleted) {
      this.openRestoreDialog(series);
    } else {
      this.openDeleteDialog(series);
    }
  };

  // Implementation for handleRestore callback
  handleRestore = (series) => {
    this.openRestoreDialog(series);
  };

  // Series-specific edit dialog handling
  openEditDialog = (series) => {
    this.cardEditManager.openEditDialog(series);
    this.currentSeries = series;
    routeStore.setSeriesId(series.id);
    editSeriesStore.reset(series);
    groupedSeriesStore.openEditSeriesDialog(series);
  };

  closeEditDialog = () => {
    this.cardEditManager.closeEditDialog();
    this.currentSeries = null;
  };
}

const seriesCardStore = new SeriesCardStore();
export default seriesCardStore;