import { makeAutoObservable, runInAction, computed, observable } from 'mobx';
import routeStore from './routeStore';
import coursesStore from './coursesStore';
import uiStore from './uiStore';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';

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

  constructor() {
    makeAutoObservable(this, {
      currentSeriesId: computed,
      uniqueCategories: computed,
      selectedCategory: observable,
      filteredSeriesCourses: computed,
      currentSeriesFromRoute: computed
    });
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
    this.currentSeries = series;
    this.selectedCategory = series?.category || '';
    
    // Determine if the current description is an image URL
    if (series?.desc && (
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

  fetchSeries = async () => {
    try {
      this.isLoading = true;
      await this.fetchInstructors();
      const response = await fetch('/api/series');
      const data = await response.json();
      runInAction(() => {
        this.series = data;
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
    try {
      this.isLoading = true;
      
      await this.fetchInstructors();
      const response = await fetch(`/api/series/${id}`);
      const data = await response.json();
      
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
        const response = await fetch('/api/instructors');
        const data = await response.json();
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

  saveSeriesPost = data => fetch('/api/save?doc=series', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(r => r.json());

  handleSubmit = async (form, navigate) => {
    const formData = new FormData(form);
    
    // Create the series data object
    const seriesData = {
      name: formData.get('name'),
      category: this.selectedCategory,
      cover: this.currentSeries?.cover,
      desc: this.descType === 'text' ? formData.get('description') : this.selectedDescImagePreview
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
      const data = await this.saveSeriesPost(seriesData);
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
        await this.saveSeriesPost(seriesData);
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

  get filteredSeriesCourses() {
    const currentSeries = this.currentSeriesFromRoute;
    if (!currentSeries) return [];

    return coursesStore.courses.filter(course => {
      // Always filter by series ID
      const matchesSeries = course.series?.id === currentSeries.id;

      // Apply instructor filter if one is selected
      const selectedInstructorId = uiStore?.selectedInstructorId;
      const matchesInstructor = !selectedInstructorId ||
        course.instructor?.id === selectedInstructorId ||
        course.instructor?.name === coursesStore.instructors.find(i => i.id === selectedInstructorId)?.name;
      
      // Apply search filter if there's a search keyword
      const searchKeyword = uiStore?.searchKeyword?.toLowerCase() || '';
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        (course.instructor?.name && course.instructor?.name.toLowerCase().includes(searchKeyword)) ||
        (course.description && course.description.toLowerCase().includes(searchKeyword));
      
      return matchesSeries && matchesInstructor && matchesSearch;
    });
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
}

const seriesStore = new SeriesStore();
export default seriesStore;