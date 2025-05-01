import { makeAutoObservable, runInAction } from 'mobx';
import db from '../utils/db';
import { getApiBaseUrl } from '../config';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';

const defaultInstructor = {
  id: null,
  name: '',
  title: '',
  bio: '',
  expertise: '',
  iconUrl: ''
};

class InstructorsStore {
  // Instructors data
  instructors = [];
  loading = false;
  error = null;
  
  // Search filter
  searchQuery = '';
  
  // New instructor form state
  currentInstructor = {...defaultInstructor}

  isEditMode = false;

  get filteredInstructors() {
    if (!this.searchQuery) return this.instructors;
    
    const query = this.searchQuery.toLowerCase();
    return this.instructors.filter(instructor =>
      instructor.name?.toLowerCase().includes(query) ||
      instructor.title?.toLowerCase().includes(query) ||
      instructor.bio?.toLowerCase().includes(query) ||
      instructor.expertise?.toLowerCase().includes(query)
    );
  }
  
  constructor() {
    makeAutoObservable(this);
  }

  async fetchInstructors() {
    this.loading = true;
    this.error = null;
    
    try {
      const instructors = await db.getAllInstructors();
      
      runInAction(() => {
        this.instructors = instructors || [];
        this.loading = false;
      });
    } catch (error) {
      console.error('Error fetching instructors:', error);
      
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }
  
  setInstructors(instructors) {
    this.instructors = instructors;
  }
  
  reset() {
    this.instructors = [];
    this.loading = false;
    this.error = null;
    this.resetInstructor();
  }

  setSearchQuery = (query) => {
    this.searchQuery = query;
  };

  setInstructorField = (field, value) => {
    this.currentInstructor[field] = value;
  };

  resetInstructor = () => {
    this.currentInstructor = {...defaultInstructor};
    this.isEditMode = false;
  };

  uploadInstructorIcon = async (file, instructorId) => {
    try {
      return await uploadToCloudinary(file, `${clientStore.client.id}/instructors/${instructorId}`);
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  };

  selectedImagePreview = null;

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
  };

  saveInstructor = async (formData) => {
    this.loading = true;
    this.error = null;

    try {
      // First save the instructor data
      const instructorData = {
        id: this.currentInstructor.id,
        name: formData.get('name'),
        title: formData.get('title'),
        bio: formData.get('bio'),
        expertise: formData.get('expertise'),
        iconUrl: this.currentInstructor.iconUrl
      };

      const response = await fetch(`${getApiBaseUrl()}/save?doc=instructors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instructorData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save instructor: ${response.statusText}`);
      }

      const savedInstructor = await response.json();

      // If there's a new icon file, upload it
      const iconFile = formData.get('icon');
      if (iconFile instanceof File) {
        const imageUrl = await this.uploadInstructorIcon(iconFile, savedInstructor.id);
        savedInstructor.iconUrl = imageUrl;
        
        // Update the instructor with the new icon URL
        await fetch(`${getApiBaseUrl()}/save?doc=instructors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedInstructor)
        });
      }
      
      runInAction(() => {
        if (this.isEditMode) {
          const index = this.instructors.findIndex(i => i.id === savedInstructor.id);
          if (index !== -1) {
            this.instructors[index] = savedInstructor;
          }
        } else {
          this.instructors.push(savedInstructor);
        }
        this.resetInstructor();
        this.selectedImagePreview = null;
        this.loading = false;
      });

      return savedInstructor;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  };
  
  setInstructor(id) {
    this.currentInstructor = this.instructors.find(i => i.id === +(id || 0)) || {...defaultInstructor};
    this.isEditMode = !!id;
  }
}

// Create and export a singleton instance
const instructorsStore = new InstructorsStore();
export default instructorsStore;