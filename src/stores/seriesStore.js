import { makeObservable, runInAction, computed } from 'mobx';
import routeStore from './routeStore';
import uiStore from './uiStore';
import languageStore from './languageStore';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';
import { get, save } from '../utils/db';
import _ from 'lodash';

const durationOptionKeys = ['30days', '90days', '180days', '365days'];

class SeriesStore {
  series = [];
  instructors = [];
  currentSeries = null;
  isLoading = false;
  error = null;
  selectedImagePreview = null;
  selectedDescImagePreview = null;
  descType = 'text'; // 'text' or 'image'
  isDropdownOpen = false;
  selectedCategory = '';
  pendingGroups = null;
  groupOrder = [];
  pendingSeriesUpdates = new Map();

  constructor() {
    makeObservable(this, {
      series: true,
      instructors: true,
      currentSeries: true,
      isLoading: true,
      error: true,
      selectedImagePreview: true,
      selectedDescImagePreview: true,
      descType: true,
      isDropdownOpen: true,
      selectedCategory: true,
      pendingGroups: true,
      groupOrder: true,
      pendingSeriesUpdates: true,
      durationOptions: computed,
      currentSeriesId: computed,
      uniqueCategories: computed,
      currentSeriesFromRoute: computed,
      filteredSeriesCourses: computed,
      seriesInstructors: computed,
      groupedSeries: computed,
      isSeriesValid: computed,
      validSeriesItems: computed,
      filteredSeries: computed
    });
  }

  get durationOptions() {
    const { t } = languageStore;
    return durationOptionKeys.map(key => ({
      key,
      value: t(`series.edit.durationOptions.${key}`)
    }));
  }

  setDescType = (type) => {
    this.descType = type;
    if (type === 'text' && this.selectedDescImagePreview) {
      this.selectedDescImagePreview = null;
    }
  }

  setSelectedImagePreview = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        runInAction(() => {
          this.selectedImagePreview = reader.result;
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedImagePreview = null;
    }
  }

  setSelectedDescImagePreview = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        runInAction(() => {
          this.selectedDescImagePreview = reader.result;
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedDescImagePreview = null;
    }
  }

  get currentSeriesId() {
    return routeStore.seriesId;
  }

  get uniqueCategories() {
    const categories = this.series
      .map(series => series.category)
      .filter(category => category); // Filter out null/undefined
    return [...new Set(categories)].sort();
  }

  setCurrentSeries = (series) => {
    if (!series) {
      series = {
        name: '',
        desc: '',
        instructor: null,
        cover: '',
        category: '',
        price: '',
        duration: '30days',
        group: ''
      };
    }
    
    this.currentSeries = series;
    this.selectedCategory = series.category || '';
    series.price = series.price || '';
    series.duration = series.duration || this.durationOptions[0];
    
    // Determine if the current description is an image URL
    if (series.desc && (
      series.desc.startsWith('http://') ||
      series.desc.startsWith('https://') ||
      series.desc.startsWith('data:image/')
    )) {
      this.descType = 'image';
      this.selectedDescImagePreview = series.desc;
    } else {
      this.descType = 'text';
      this.selectedDescImagePreview = null;
    }
  }

  toggleDropdown = () => {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown = () => {
    this.isDropdownOpen = false;
  }

  setSelectedCategory = (category, closeDropdown = false) => {
    this.selectedCategory = category;
    if (closeDropdown) {
      this.isDropdownOpen = false;
    }
    if (this.currentSeries) {
      this.currentSeries.category = category;
    }
  }

  setSeries = (series) => {
    this.series = series;
  }

  fetchSeries = async () => {
    try {
      this.isLoading = true;
      await this.fetchInstructors();
      const data = await get('series', { clientId: clientStore.client.id });
      runInAction(() => {
        this.series = data.map((s, index) => ({
          ...s,
          order: typeof s.order === 'number' ? s.order : index
        }));
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  fetchSeriesById = async (id) => {
    if (!id) {
      console.warn('Attempted to fetch series with undefined ID');
      return;
    }

    try {
      this.isLoading = true;
      
      await this.fetchInstructors();
      const data = await get(`series/${id}`);
      
      if (!data || !data[0]) {
        throw new Error('Series not found');
      }

      const series = data[0];
      console.log('API Response:', series); // Debug log

      runInAction(() => {
        this.setCurrentSeries(series);
        console.log('Set currentSeries:', this.currentSeries); // Debug log
        console.log(this.instructors)
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  fetchInstructors = async () => {
    if (this.instructors.length === 0) {
      try {
        this.isLoading = true;
        const data = await get('instructors', { clientId: clientStore.client.id });
        runInAction(() => {
          this.instructors = data;
          this.isLoading = false;
        });
      } catch (error) {
        runInAction(() => {
          this.error = error.message;
          this.isLoading = false;
        });
      }
    }
  }

  uploadSeriesImage = async (file, seriesId) => {
    return await uploadToCloudinary(file, `${clientStore.client.id}/series/${seriesId}`);
  }

  handleSubmit = async (form, navigate) => {
    const formData = new FormData(form);
    
    // Create the series data object
    const seriesData = {
      name: formData.get('name'),
      category: this.selectedCategory,
      cover: this.currentSeries?.cover,
      desc: this.descType === 'text' ? formData.get('description') : this.selectedDescImagePreview,
      price: formData.get('price'),
      duration: formData.get('duration'),
      group: this.currentSeries?.group || '',
      order: this.currentSeries?.order
    };

    // Add series ID if editing
    const seriesId = routeStore.seriesId;
    if (seriesId) {
      seriesData.id = parseInt(seriesId);
    }

    try {
      await this.saveSeries(seriesData, navigate);
      return true;
    } catch (error) {
      console.error('Failed to save series:', error);
      return false;
    }
  }

  saveSeries = async (seriesData, navigate) => {
    try {
      this.isLoading = true;
      const data = await save('series', seriesData);
      const seriesId = data.id;

      // Handle cover image upload
      // const coverImage = formData.get('cover_image');
      // if (coverImage instanceof File) {
      //   const imageUrl = await this.uploadSeriesImage(coverImage, seriesId);
      //   seriesData.cover = imageUrl;
      //   await this.saveSeriesPost(seriesData);
      // }

      // Handle description image upload
      // Handle image upload if needed
      if (this.descType === 'image' && this.selectedDescImagePreview?.startsWith('data:')) {
        const arr = this.selectedDescImagePreview.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const imageToUpload = new File([u8arr], 'desc_image', { type: mime });
        const imageUrl = await this.uploadSeriesImage(imageToUpload, data.id);
        seriesData.desc = imageUrl;
        await save('series', seriesData);
      }

      runInAction(() => {
        this.isLoading = false;
        routeStore.navigateToSeries(seriesId, navigate);
      });
      return seriesData;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  }
  get currentSeriesFromRoute() {
    return routeStore.currentSeries;
  }

  get isSeriesValid() {
    return Array.isArray(this.series);
  }

  get validSeriesItems() {
    if (!this.isSeriesValid) return [];
    return this.series.filter(series => series && typeof series === 'object');
  }

  get filteredSeries() {
    if (!this.isSeriesValid) return [];
    
    const searchKeyword = (uiStore.searchKeyword || '').toLowerCase();
    const selectedInstructorId = uiStore.selectedInstructorId || null;
    const activeCategory = uiStore.activeCategory || '';
    const isGroupMode = uiStore.activeNavItem === 'group';
    const validGroups = new Set(clientStore.client.settings.groups);
    
    return this.validSeriesItems.filter(series => {
      if (isGroupMode && (!series.group || !validGroups.has(series.group))) {
        return false;
      }
      
      const matchesSearch = !searchKeyword ||
        (series.name?.toLowerCase().includes(searchKeyword)) ||
        (series.desc?.toLowerCase().includes(searchKeyword)) ||
        (series.instructor?.name?.toLowerCase().includes(searchKeyword));
      
      const matchesInstructor = selectedInstructorId === null ||
        (series.instructor?.id === selectedInstructorId);

      const matchesCategory = !activeCategory || series.category === activeCategory;
      
      return matchesSearch && matchesInstructor && matchesCategory;
    });
  }

  get filteredSeriesCourses() {
    const currentSeries = this.currentSeriesFromRoute;
    if (!currentSeries) return [];

    return currentSeries.courses.filter(course => {
      // Apply instructor filter if one is selected
      const selectedInstructorId = uiStore?.selectedInstructorId;
      const matchesInstructor = !selectedInstructorId ||
        course.instructor_id === selectedInstructorId;
      
      // Apply search filter if there's a search keyword
      const searchKeyword = uiStore?.searchKeyword?.toLowerCase() || '';
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        (this.getInstructorById(course.instructor_id)?.name.toLowerCase().includes(searchKeyword)) ||
        (course.description && course.description.toLowerCase().includes(searchKeyword));
      
      return matchesInstructor && matchesSearch;
    });
  }

  getInstructorById = (id) => (this.instructors || []).find(instructor => instructor.id === id);

  get seriesInstructors() {
    return this.getSeriesInstructors(this.currentSeriesFromRoute, true);
  }

  getSeriesInstructors = (series, isFiltered) => {
    if (!series) return [];

    const ids = new Set((series.courses || [])
    //const ids = new Set(((isFiltered ? this.filteredSeriesCourses : series.courses) || [])
      .map(course => course.instructor_id))

    return [...ids].map(this.getInstructorById);
  }

  handleBackNavigation = () => {
    // If we came from an instructor page, we'll go back to that instructor
    const currentSeries = this.currentSeriesFromRoute;
    if (currentSeries?.instructor?.id) {
      routeStore.navigateToInstructor(currentSeries.instructor?.id);
    } else {
      // Otherwise, go to the main series page
      routeStore.setSeriesId(null);
      // Let the BackButton handle the actual navigation
    }
  }

  moveSeries = (group, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    // Get the current ordered series for this group
    const currentGroupSeries = [...this.groupedSeries[group]];
    
    // Move the series within the group
    const [movedSeries] = currentGroupSeries.splice(fromIndex, 1);
    currentGroupSeries.splice(toIndex, 0, movedSeries);

    // Update orders in the moved range
    currentGroupSeries.forEach((series, index) => {
      series.order = index;
    });

    // Update the main series array
    const seriesList = [...this.series];
    currentGroupSeries.forEach(series => {
      const seriesIndex = seriesList.findIndex(s => s.id === series.id);
      if (seriesIndex !== -1) {
        const updatedSeries = {
          ...seriesList[seriesIndex],
          order: series.order
        };
        seriesList[seriesIndex] = updatedSeries;
        this.pendingSeriesUpdates.set(series.id, updatedSeries);
      }
    });

    this.series = seriesList;
  }

  get groupedSeries() {
    if (!this.isSeriesValid) return {};

    // Initialize groupOrder if empty
    if (this.groupOrder.length === 0) {
      this.groupOrder = [...clientStore.client.settings.groups];
    }

    const groups = this.groupOrder;
    const grouped = {};

    groups.forEach(group => {
      // Get series for this group and sort by order
      const groupSeries = this.filteredSeries.filter(series => series.group === group);
      
      // Initialize order if not set
      groupSeries.forEach((series, index) => {
        if (typeof series.order !== 'number') {
          series.order = index;
        }
      });
      
      // Sort by order property
      grouped[group] = groupSeries.sort((a, b) => a.order - b.order);
    });

    return grouped;
  }

  setGroupOrder = (groups) => {
    this.groupOrder = groups;
  };

  moveGroup = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const groups = this.groupOrder.length > 0
      ? [...this.groupOrder]
      : [...clientStore.client.settings.groups];

    const [removed] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, removed);
    
    // Update local state only
    this.groupOrder = groups;
    this.pendingGroups = groups;
  };

  saveGroupOrder = async () => {
    if (!this.pendingGroups) return;

    try {
      // Update client settings and save
      clientStore.client.settings.groups = this.pendingGroups;
      await save('clients', clientStore.client)
      
      // Clear pending changes after successful save
      this.pendingGroups = null;
    } catch (error) {
      console.error('Failed to save group order:', error);
      throw error;
    }
  };

  saveSeriesUpdates = async () => {
    if (this.pendingSeriesUpdates.size === 0) return;

    try {
      const updates = Array.from(this.pendingSeriesUpdates.values());
      console.log('Saving series updates:', updates);

      await Promise.all(updates.map(series => save('series', _.omit(series, ['courses']))));
      
      this.pendingSeriesUpdates.clear();
    } catch (error) {
      console.error('Failed to save series updates:', error);
      throw error;
    }
  };
}

const seriesStore = new SeriesStore();
export default seriesStore;