import { makeAutoObservable, runInAction } from 'mobx';
import uiStore from './uiStore';
import { t } from './languageStore';
import { combineStores } from '../utils/storeUtils';
import clientStore from './clientStore';
import editSeriesStore from './editSeriesStore';
import { get, save } from '../utils/db';
import { omit } from '../utils/omit';
import userStore from './userStore';
import EditingStore from './editingStore';
import GroupedListStore from './groupedListStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import instructorStore from './instructorStore';

class SeriesStore {
  selectedCategory;
  selectedInstructorId;
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
      item => !this.selectedInstructorId || this.getSeriesInstructors(item).some(x => x.id === +this.selectedInstructorId)
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
      cover: '',
    };
  }

  get allInstructors() {
    return instructorStore.items || [];
  }

  get uniqueCategories() {
    return [...new Set(this.items.map(s => s.category))].filter(Boolean);
  }

  get durationOptions() {
    return [
      { key: '30days', value: '30 Days' },
      { key: '60days', value: '60 Days' },
      { key: '90days', value: '90 Days' },
      { key: '180days', value: '180 Days' },
      { key: '365days', value: '365 Days' }
    ];
  }

  get stepTitles() {
    return ['selectGroup', 'nameAndCategory', 'cover', 'description', 'priceAndDuration']
      .map(x => t(`series.edit.steps.${x}`));
  }

  fetchItemList = async function() {
    const series = await get('series', { clientId: clientStore.client.id });
    return series.map((s, index) => ({
      ...s,
      order: typeof s.order === 'number' ? s.order : index,
      isPaid: userStore.isPaid('series', s.id)
    }));
  }

  save = async function(item) {
    await save('series', omit(item, ['_id', 'courses', 'isPaid']));
  }

  // fetchSeries = async () => {
  //   try {
  //     this.isLoading = true;
  //     await this.fetchInstructors();
  //     const data = await get('series', { clientId: clientStore.client.id });
  //     runInAction(() => {
  //       this.series = data.map((s, index) => ({
  //         ...s,
  //         order: typeof s.order === 'number' ? s.order : index,
  //         isPaid: userStore.isPaid('series', s.id)
  //       }));
  //       this.isLoading = false;
  //     });
  //   } catch (error) {
  //     runInAction(() => {
  //       this.error = error.message;
  //       this.isLoading = false;
  //     });
  //   }
  // }

  // fetchSeriesById = async (id) => {
  //   if (!id) {
  //     console.warn('Attempted to fetch series with undefined ID');
  //     return;
  //   }

  //   try {
  //     this.isLoading = true;
      
  //     await this.fetchInstructors();
  //     const data = await get('series', { id });
      
  //     if (!data || !data[0]) {
  //       throw new Error('Series not found');
  //     }

  //     const series = data[0];
      
  //     runInAction(() => {
  //       editSeriesStore.reset(series);
  //       this.isLoading = false;
  //     });
  //   } catch (error) {
  //     runInAction(() => {
  //       this.error = error.message;
  //       this.isLoading = false;
  //     });
  //   }
  // }

  // handleSubmit = async (form, navigate) => {
  //   try {
  //     const savedSeries = await editSeriesStore.saveSeries();
  //     if (savedSeries) {
  //       routeStore.navigateToSeries(savedSeries.id, navigate);
  //     }
  //     return true;
  //   } catch (error) {
  //     console.error('Failed to save series:', error);
  //     return false;
  //   }
  // }

  // get currentSeriesFromRoute() {
  //   return routeStore.currentSeries;
  // }

  // get isSeriesValid() {
  //   return Array.isArray(this.series);
  // }

  // get validSeriesItems() {
  //   if (!this.isSeriesValid) return [];
  //   return this.series.filter(series => series && typeof series === 'object' && !series.deleted);
  // }

  // get deletedSeries() {
  //   return this.series.filter(series => series && typeof series === 'object' && series.deleted);
  // }

  // get filteredSeries() {
  //   if (!this.isSeriesValid) return [];
    
  //   const searchKeyword = (uiStore.searchKeyword || '').toLowerCase();
  //   const selectedInstructorId = uiStore.selectedInstructorId || null;
  //   const activeCategory = uiStore.activeCategory || '';
  //   const isGroupMode = uiStore.activeNavItem === 'group';
  //   const validGroups = new Set(clientStore.client.settings.groups);
  //   const isSettingsMode = routeStore.isSeriesSettingMode;
    
  //   return this.validSeriesItems.filter(series => {
  //     if (isGroupMode && (!series.group || !validGroups.has(series.group))) {
  //       return false;
  //     }

  //     // Hide series if hidden is true and not in settings mode
  //     if (!isSettingsMode && series.hidden) {
  //       return false;
  //     }
      
  //     const matchesSearch = !searchKeyword ||
  //       (series.name?.toLowerCase().includes(searchKeyword)) ||
  //       (series.desc?.toLowerCase().includes(searchKeyword)) ||
  //       (series.instructor?.name?.toLowerCase().includes(searchKeyword));
      
  //     const matchesInstructor = selectedInstructorId === null ||
  //       (series.instructor?.id === selectedInstructorId);

  //     const matchesCategory = !activeCategory || series.category === activeCategory;
      
  //     return matchesSearch && matchesInstructor && matchesCategory;
  //   });
  // }

  // get filteredSeriesCourses() {
  //   const currentSeries = this.currentSeriesFromRoute;
  //   if (!currentSeries) return [];

  //   return currentSeries.courses.filter(course => {
  //     const selectedInstructorId = uiStore?.selectedInstructorId;
  //     const matchesInstructor = !selectedInstructorId ||
  //       course.instructor_id === selectedInstructorId;
      
  //     const searchKeyword = uiStore?.searchKeyword?.toLowerCase() || '';
  //     const matchesSearch = !searchKeyword ||
  //       course.title.toLowerCase().includes(searchKeyword) ||
  //       (this.getInstructorById(course.instructor_id)?.name.toLowerCase().includes(searchKeyword)) ||
  //       (course.description && course.description.toLowerCase().includes(searchKeyword));
      
  //     return matchesInstructor && matchesSearch;
  //   });
  // }

  // get mySeries() {
  //   return this.filteredSeries.filter(series => series.isPaid);
  // }

  getInstructorById = function(id) {
    return this.allInstructors.find(instructor => instructor.id === id);
  }

  // get seriesInstructors() {
  //   return this.getSeriesInstructors(this.currentSeriesFromRoute, true);
  // }

  getSeriesInstructors = function(series) {
    if (!series) return [];

    const ids = new Set((series.courses || [])
      .map(course => course.instructor_id))

    return [...ids].map(id => this.getInstructorById(id)).filter(x => x);
  }

  // handleBackNavigation = () => {
  //   const currentSeries = this.currentSeriesFromRoute;
  //   if (currentSeries?.instructor?.id) {
  //     routeStore.navigateToInstructor(currentSeries.instructor?.id);
  //   } else {
  //     routeStore.setSeriesId(null);
  //   }
  // }

  // moveSeries = (group, fromIndex, toIndex) => {
  //   if (fromIndex === toIndex) return;

  //   const currentGroupSeries = [...this.groupedSeries[group]];
    
  //   const [movedSeries] = currentGroupSeries.splice(fromIndex, 1);
  //   currentGroupSeries.splice(toIndex, 0, movedSeries);

  //   currentGroupSeries.forEach((series, index) => {
  //     series.order = index;
  //   });

  //   const seriesList = [...this.series];
  //   currentGroupSeries.forEach(series => {
  //     const seriesIndex = seriesList.findIndex(s => s.id === series.id);
  //     if (seriesIndex !== -1) {
  //       const updatedSeries = {
  //         ...seriesList[seriesIndex],
  //         order: series.order
  //       };
  //       seriesList[seriesIndex] = updatedSeries;
  //       this.pendingSeriesUpdates.set(series.id, updatedSeries);
  //     }
  //   });

  //   this.series = seriesList;
  // }

  // get groupedSeries() {
  //   if (!this.isSeriesValid) return {};

  //   const groups = clientStore.client.settings.groups || [];
  //   const grouped = {};

  //   groups.forEach(group => {
  //     const groupSeries = this.filteredSeries.filter(series => series.group === group);
      
  //     groupSeries.forEach((series, index) => {
  //       if (typeof series.order !== 'number') {
  //         series.order = index;
  //       }
  //     });
      
  //     grouped[group] = groupSeries.sort((a, b) => a.order - b.order);
  //   });

  //   return grouped;
  // }

  // saveGroupOrder = async () => {
  //   // This method is called by GroupedList but group order is now managed by groupedListStore
  //   // The actual saving is handled by the individual group management methods
  // };

  // saveSeriesUpdates = async () => {
  //   if (this.pendingSeriesUpdates.size === 0) return;

  //   try {
  //     for (const series of this.pendingSeriesUpdates.values()) {
  //       await save('series', series);
  //     }
  //     this.pendingSeriesUpdates.clear();
  //   } catch (error) {
  //     console.error('Failed to save series updates:', error);
  //     throw error;
  //   }
  // };

  // toggleVisibility = async (seriesId) => {
  //   const series = this.series.find(s => s.id === seriesId);
  //   if (!series) return;

  //   const updatedSeries = {
  //     ...series,
  //     hidden: !series.hidden
  //   };

  //   // Update local state
  //   this.series = this.series.map(s =>
  //     s.id === seriesId ? updatedSeries : s
  //   );

  //   // Save to database
  //   try {
  //     await save('series', updatedSeries);
  //   } catch (error) {
  //     console.error('Failed to toggle series visibility:', error);
  //     throw error;
  //   }
  // };

  // deleteItem = async (seriesId, isRestore) => {
  //   const series = this.series.find(s => s.id === seriesId);
  //   if (!series) return;
  //   series.deleted = !isRestore;

  //   try {
  //     await save('series', series);
  //   } catch (error) {
  //     console.error('Failed to delete series:', error);
  //     throw error;
  //   }
  // };

  get totalSteps() {
    return this.stepTitles.length;
  }

  nextStep = () => {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep = () => {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  setStep = (step) => {
    this.currentStep = step;
  }

  get canProceedToStep2() {
    return this.group !== '';
  }

  get canProceedToStep3() {
    return this.name !== '' && this.category !== '';
  }

  get canProceedToStep4() {
    return this.image !== '';
  }

  get canProceedToStep5() {
    return (this.descType === 'text' && this.description !== '') ||
           (this.descType === 'image' && this.descImage !== '');
  }

  get canSave() {
    return (
      this.name &&
      this.price &&
      this.duration &&
      ((this.descType === 'text' && this.description) ||
        (this.descType === 'image' && this.descImage))
    );
  }

  setError = (error) => {
    this.error = error;
  }

  clearError = () => {
    this.error = null;
  }

  validateStep = async (step) => {
    switch (step) {
      case 1:
        if (!this.canProceedToStep2) {
          return t('series.edit.errors.groupRequired');
        }
        break;
      case 2:
        if (!this.canProceedToStep3) {
          return t('series.edit.errors.nameAndCategoryRequired');
        }
        await this.saveSeries(true);
        break;
      case 3:
        if (!this.canProceedToStep4) {
          return t('series.edit.errors.coverImageRequired');
        }
        break;
      case 4:
        if (!this.canProceedToStep5) {
          if (this.descType === 'text') {
            return t('series.edit.errors.descriptionRequired');
          }
          return t('series.edit.errors.descriptionImageRequired');
        }
        break;
      case 5:
        if (!this.canSave) {
          return t('series.edit.errors.priceAndDurationRequired');
        }
        await this.saveSeries(true);
        break;
      case 6:
        if (!this.courses || this.courses.length === 0) {
          return t('series.edit.errors.coursesRequired');
        }
        break;
    }
    return null;
  }

  toggleDropdown = () => {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown = () => {
    this.isDropdownOpen = false;
  }

  reset = (series = null) => {
    this.editingSeries = series;
    this.name = series?.name || '';
    this.category = series?.category || '';
    this.group = series?.group || '';
    this.price = series?.price || '';
    this.duration = series?.duration || '30days';
    this.descType = series?.desc.startsWith('http') ? 'image' : 'text';
    this.description = series?.desc || '';
    this.image = series?.cover || '';
    this.descImage = this.descType === 'image' ? series?.desc : '';
    this.courses = series?.courses || [];
    this.isLoading = false;
    this.error = null;
    this.currentStep = 1;
    this.isDropdownOpen = false;
  }

}


export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, SeriesStore);
