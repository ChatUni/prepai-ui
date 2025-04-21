import { makeAutoObservable, runInAction } from 'mobx';
import db from '../utils/db';
import { getApiBaseUrl } from '../config';

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

  saveInstructor = async () => {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`${getApiBaseUrl()}/instructors/${this.currentInstructor.id || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.currentInstructor)
      });

      if (!response.ok) {
        throw new Error(`Failed to save instructor: ${response.statusText}`);
      }

      const savedInstructor = await response.json();
      
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