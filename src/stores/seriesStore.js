import { makeAutoObservable, runInAction, computed, observable } from 'mobx';
import routeStore from './routeStore';

class SeriesStore {
  series = [];
  instructors = [];
  currentSeries = null;
  isLoading = false;
  error = null;
  selectedImagePreview = null;

  constructor() {
    makeAutoObservable(this, {
      currentSeriesId: computed
    });
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

  get currentSeriesId() {
    return routeStore.seriesId;
  }

  setCurrentSeries = (series) => {
    this.currentSeries = series;
  }

  fetchSeries = async () => {
    try {
      this.isLoading = true;
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
      
      // First get the series data
      const response = await fetch(`/api/series/${id}`);
      const data = await response.json();
      
      if (!data || !data[0]) {
        throw new Error('Series not found');
      }

      const series = data[0];
      console.log('API Response:', series); // Debug log

      runInAction(() => {
        this.currentSeries = series;
        console.log('Set currentSeries:', this.currentSeries); // Debug log
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
    }
  }

  uploadToCloudinary = async (file, seriesId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `prepai/${seriesId}`);

    const response = await fetch(`/api/cloudinary_upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }

    const data = await response.json();
    return data.secure_url;
  }

  saveSeries = async (formData, navigate) => {
    try {
      this.isLoading = true;
      
      // Parse instructor data from FormData
      const instructor = JSON.parse(formData.get('instructor'));
      
      // Convert FormData to JSON for API
      const seriesData = {
        name: formData.get('name'),
        desc: formData.get('description'), // Map description to desc
        instructor // Use the full instructor object
      };

      if (formData.get('id')) {
        seriesData.id = parseInt(formData.get('id'));
      }

      // First save the series to get an ID if it's a new series
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seriesData),
      });
      
      const data = await response.json();
      const seriesId = data.id;

      // Handle file upload to Cloudinary if a new image is provided
      const coverImage = formData.get('cover_image');
      if (coverImage instanceof File) {
        const imageUrl = await this.uploadToCloudinary(coverImage, seriesId);
        
        // Update the series with the Cloudinary URL
        const updateResponse = await fetch('/api/series', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: seriesId,
            cover: imageUrl, // Map cover_image to cover
            ...seriesData
          }),
        });
        
        await updateResponse.json();
      }

      runInAction(() => {
        this.isLoading = false;
        routeStore.navigateToSeries(seriesId, navigate);
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  }
}

export const seriesStore = new SeriesStore();