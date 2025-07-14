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
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import { runInAction } from 'mobx';
import editCourseStore from './editCourseStore';
import { uploadImage } from '../utils/uploadHelper';

class SeriesStore {
  selectedCategory;
  selectedInstructorId;
  showPaidOnly = false;
  pendingSeriesUpdates = new Map();
  
  get name() {
    return 'series';
  }

  get pageTitle() {
    return this.isAdminMode ? t('menu.admin_page.course_settings') : t('menu.series.title');
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
      item => this.isAdminMode || !this.showPaidOnly || item.isPaid
    ];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      category: '',
      group: '',
      price: '',
      duration: '30days',
      descType: 'text',
      desc: '',
      image: '',
    };
  }

  get allInstructors() {
    return instructorStore.items || [];
  }

  get uniqueCategories() {
    return [...new Set(this.items.map(s => s.category))].filter(Boolean);
  }

  get durationOptions() {
    return [30, 60, 90, 180, 365].map(x => ({ value: `${x}days`, text: `${x} ${t('series.edit.days')}` }))
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
        isValid: x => x.courses && x.courses.length > 0,
        error: 'coursesRequired',
        // save: x => this.saveCourses(x)
      }
    ];
  }

  fetchItemList = async function() {
    const series = await get('series', { clientId: clientStore.client.id });
    return series.map((s, index) => ({
      ...s,
      order: typeof s.order === 'number' ? s.order : index,
      descType: s.desc?.startsWith('https://') ? 'image' : 'text',
      isPaid: userStore.isSeriesPaid(s.id),
      courses: s.courses.map(c => ({
        ...c,
        isFree: c.isFree == null ? false : c.isFree
      }))
    }));
  }

  save = async function(item = this.editingItem || {}) {
    if (!item.id) {
      const data = await this.saveSeries(item);
      item.id = data.id;
    }

    if (item.image instanceof File) {
      const url = await uploadImage(item.image, `series/${item.id}/cover.jpg`);
      item.image = url;
    }

    if (item.descType === 'image' && item.desc instanceof File) {
      const url = await uploadImage(item.desc, `series/${item.id}/desc.jpg`);
      item.desc = url;
    }

    await this.saveSeries(item);
  }

  saveSeries = async function(item) {
    await save('series', omit({
      ...item,
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

  updateCourse = async function() {
    try {
      const course = await editCourseStore.saveCourse(this.editingSeries?.id);
      
      runInAction(() => {
        const courses = [...this.courses];
        const existingIndex = courses.findIndex(c => c.id === course.id);
        
        if (existingIndex >= 0) {
          // Replace existing course
          courses[existingIndex] = course;
        } else {
          // Add new course to the end
          courses.push(course);
        }
        
        this.courses = courses;
        this.closeEditCourseDialog();
      });

      return course;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  }
}


export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, SeriesStore);
