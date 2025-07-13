import { combineStores } from '../utils/storeUtils';
import EditingStore from './editingStore';
import GroupedListStore from './groupedListStore';
import ListStore from './listStore';
import PageStore from './pageStore';

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
  
  save = async function(item) {
    await save('courses', item);
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, CourseStore);
