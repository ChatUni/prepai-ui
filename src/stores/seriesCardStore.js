import { makeAutoObservable, computed } from 'mobx';
import coursesStore from './coursesStore';
import routeStore from './routeStore';
import languageStore from './languageStore';
import seriesStore from './seriesStore';
import groupedSeriesStore from './groupedSeriesStore';

class SeriesCardStore {
  constructor() {
    makeAutoObservable(this);
  }

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

  getCourseCount = (seriesId) => {
    return coursesStore.courses.filter(course =>
      course?.series?.id === seriesId || course?.series?._id === seriesId
    ).length;
  };

  getCoverImage = (cover) => {
    return cover || 'https://via.placeholder.com/300x200?text=Series';
  };

  getFormattedInstructors = (series) => {
    const instructors = coursesStore.getSeriesInstructors(series);
    return instructors.map(instructor => ({
      id: instructor.id || instructor._id,
      name: instructor.name || '',
      iconUrl: instructor.iconUrl || '',
      initial: instructor.name?.[0]?.toUpperCase() || '?'
    }));
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

  getCourseCountText = (count) => {
    return languageStore.t('series.courseCount', { count });
  };

  openEditDialog = async (series) => {
    const seriesId = series.id || series._id;
    routeStore.setSeriesId(seriesId);
    await seriesStore.fetchSeriesById(seriesId);
    groupedSeriesStore.openEditSeriesDialog(series.group);
  };
}

const seriesCardStore = new SeriesCardStore();
export default seriesCardStore;