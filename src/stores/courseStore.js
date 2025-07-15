import { save } from '../utils/db';
import { combineStores } from '../utils/storeUtils';
import { uploadImage } from '../utils/uploadHelper';
import EditingStore from './editingStore';
import GroupedListStore from './groupedListStore';
import ListStore from './listStore';
import PageStore from './pageStore';
import seriesStore from './seriesStore';

class CourseStore {
  series;

  get name() {
    return 'course';
  }

  get pageTitle() {
    return '';
  }

  get detailRoute() {
    return `/video/${this.series.id}/{id}`;
  }

  get searchableFields() {
    return ['title'];
  }

  get newItem() {
    return {
      title: '',
      url: '',
      isVideo: true,
      isFree: false,
      series_id: this.series.id,
    };
  }

  get mediaInfo() {
    return {
      url: x => `series/${this.series.id}/courses/${x.id}/video.mp4`
    }
  }

  get validator() {
    return {
      instructor_id: 1,
      title: 1,
      url: 1,
      duration: 1,
    }
  }

  setSeries = function(series) {
    this.series = series;
    this.items = series.courses;
  }

  fetchItemList = async function(isReload) {
    let series = this.series;

    if (isReload) {
      await seriesStore.fetchItems();
      series = seriesStore.items.find(x => x.id == this.series.id);
      this.setSeries(series);
    }

    return series.courses;
  };
  
  save = async function(item) {
    return await save('courses', {
      ...item,
      instructor_id: +item.instructor_id,
      isVideo: 1,
      duration: +item.duration,
      date_modified: new Date().toISOString()
    });
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, CourseStore);
