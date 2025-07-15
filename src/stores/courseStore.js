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

  fetchItemList = function() {
    return this.series.courses;
  };
  
  saveCourse = async function(item) {
    return await save('courses', {
      ...item,
      isVideo: 1,
      date_modified: new Date().toISOString()
    });
  }

  save = async function(item = this.editingItem || {}) {
    if (!item.id) {
      const data = await this.saveCourse(item);
      item.id = data.id;
    }

    if (item.url instanceof File) {
      const url = await uploadImage(item.url, `series/${this.series.id}/courses/${item.id}/video.mp4`);
      item.url = url;
    }

    await this.saveCourse(item);

    await seriesStore.fetchItems();
    this.setSeries(seriesStore.items.find(x => x.id == this.series.id));
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, CourseStore);
