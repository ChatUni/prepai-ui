import { t } from './languageStore';
import { combineStores } from '../utils/storeUtils';
import clientStore from './clientStore';
import { get, save } from '../utils/db';
import { omit } from '../utils/utils';
import userStore from './userStore';
import EditingStore from './editingStore';
import GroupedListStore from './groupedListStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import instructorStore from './instructorStore';
import { uploadImage } from '../utils/uploadHelper';

class SeriesStore {
  selectedCategory;
  selectedInstructorId;
  pendingSeriesUpdates = new Map();
  
  get name() {
    return 'series';
  }

  get pageTitle() {
    return this.isAdminMode ? t('menu.admin_page.course_settings') : '';
  }

  get detailRoute() {
    return `/series/{id}`;
  }

  get searchableFields() {
    return ['name', 'desc'];
  }

  get filteringFields() {
    return [
      'category',
      item => !this.selectedInstructorId || this.getSeriesInstructors(item).some(x => x.id === +this.selectedInstructorId),
      item => this.isAdminMode || !this.isPaidMode || this.isPaid(item.id)
    ];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      category: '',
      group: '',
      price: 0,
      duration: 0,
      descType: 'text',
      desc: '',
      image: '',
    };
  }

  get mediaInfo() {
    return {
      image: x => `series/${x.id}/cover.jpg`,
      desc: x => `series/${x.id}/desc.jpg`
    }
  }

  get allInstructors() {
    return instructorStore.items || [];
  }

  get uniqueCategories() {
    return [...new Set(this.items.map(s => s.category))].filter(Boolean);
  }

  get durationOptions() {
    return [30, 60, 90, 180, 365].map(x => ({ value: x, text: `${x} ${t('series.edit.days')}` }))
  }

  get stepData() {
    return [
      {
        title: 'selectGroup',
        isValid: x => x.group,
        error: 'groupRequired',
      },
      {
        title: 'nameAndCategory',
        isValid: x => x.name && x.category,
        error: 'nameAndCategoryRequired',
        // save: () => this.confirmEdit(true, false)
      },
      {
        title: 'cover',
        isValid: x => x.image,
        error: 'coverImageRequired',
      },
      {
        title: 'description',
        isValid: x => x.desc,
        error: 'descriptionRequired',
      },
      {
        title: 'priceAndDuration',
        isValid: x => x.price && x.duration,
        error: 'priceAndDurationRequired',
        save: () => this.confirmEdit(true, false)
      },
      {
        title: 'courses',
        // save: x => this.saveCourses(x)
      }
    ];
  }

  isPaid = function(id) {
    return userStore.isSeriesPaid(id);
  }

  fetchItemList = async function() {
    const series = await get('series', { clientId: clientStore.client.id });
    return series.map((s, index) => ({
      ...s,
      order: typeof s.order === 'number' ? s.order : index,
      courses: s.courses.map(c => ({
        ...c,
        isFree: c.isFree == null ? false : c.isFree
      }))
    }));
  }

  save = async function(item) {
    return await save('series', omit({
      ...item,
      price: +item.price,
      duration: +item.duration,
      date_modified: new Date().toISOString()
    }, ['_id', 'courses', 'isPaid']));
  }

  remove = async function() {
    await this.toggleField('deleted');
  }

  isGroupDanger = function(group) {
    return group === t('series.groups.recycle');
  }

  getInstructorById = function(id) {
    return this.allInstructors.find(instructor => instructor.id === id);
  }

  getSeriesInstructors = function(series) {
    if (!series) return [];

    const ids = new Set((series.courses || [])
      .map(course => course.instructor_id))

    return [...ids].map(id => this.getInstructorById(id)).filter(x => x);
  }
}


export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, SeriesStore);
