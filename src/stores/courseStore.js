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
      image: '',
      url: '',
      isVideo: true,
      series_id: this.series.id,
    };
  }

  setSeries = function(series) {
    this.series = series;
    this.items = series.courses;
  }

  fetchItemList = function() {
    return series.courses;
  };
  
  saveCourses = async function(item) {
    await save('courses', {
      ...item,
      date_modified: new Date().toISOString()
    });
  }

  save = async function(item = this.editingItem || {}) {
    if (!item.id) {
      const data = await this.saveCourses(item);
      item.id = data.id;
    }

    if (item.url instanceof File) {
      const url = await uploadImage(item.url, `series/${this.series.id}/courses/${item.id}`);
      item.url = url;
    }

    await this.saveCourses(item);

    await seriesStore.fetchItems();
    this.setSeries(seriesStore.items.find(x => x.id == this.series.id));
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, CourseStore);
