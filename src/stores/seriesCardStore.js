import { makeAutoObservable, computed } from 'mobx';
import coursesStore from './coursesStore';
import routeStore from './routeStore';
import languageStore from './languageStore';
import seriesStore from './seriesStore';
import groupedSeriesStore from './groupedSeriesStore';

class SeriesCardStore {
  expandedSeriesId = null;
  editCourseDialogOpen = false;
  currentEditCourse = null;
  currentSeriesId = null;

  constructor() {
    makeAutoObservable(this);
  }

  openEditCourseDialog = (course, seriesId) => {
    this.currentEditCourse = course;
    this.currentSeriesId = seriesId;
    this.editCourseDialogOpen = true;
  };

  closeEditCourseDialog = () => {
    this.editCourseDialogOpen = false;
    this.currentEditCourse = null;
    this.currentSeriesId = null;
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

    const seriesId = series.id || series._id;
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

  getCoverImage = (cover) => {
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
    seriesStore.setCurrentSeries(series);
    groupedSeriesStore.openEditSeriesDialog(series.group);
  };
}

const seriesCardStore = new SeriesCardStore();
export default seriesCardStore;