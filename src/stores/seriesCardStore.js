import { makeAutoObservable, computed } from 'mobx';
import routeStore from './routeStore';
import languageStore from './languageStore';
import seriesStore from './seriesStore';
import groupedSeriesStore from './groupedSeriesStore';
import editCourseStore from './editCourseStore';
import editInstructorStore from './editInstructorStore';
import editSeriesStore from './editSeriesStore';

class SeriesCardStore {
  expandedSeriesId = null;
  editInstructorDialogOpen = false;
  currentEditInstructor = null;
  showVisibilityDialog = false;
  showDeleteDialog = false;
  showRestoreDialog = false;
  currentSeries = null;

  constructor() {
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

  openVisibilityDialog = (series) => {
    this.currentSeries = series;
    this.showVisibilityDialog = true;
  };

  closeVisibilityDialog = () => {
    this.showVisibilityDialog = false;
    this.currentSeries = null;
  };

  openDeleteDialog = (series) => {
    this.currentSeries = series;
    this.showDeleteDialog = true;
  };

  closeDeleteDialog = () => {
    this.showDeleteDialog = false;
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
}

const seriesCardStore = new SeriesCardStore();
export default seriesCardStore;