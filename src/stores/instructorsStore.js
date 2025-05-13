import { makeAutoObservable, runInAction } from 'mobx';
import db from '../utils/db';
import { getApiBaseUrl } from '../config';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';

class InstructorsStore {
  // Instructors data
  instructors = [];
  loading = false;
  error = null;
  
  // Search filter
  searchQuery = '';

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

  getInstructor(id) {
    return this.instructors.find(i => i.id === +(id || 0)) || null;
  }
}

// Create and export a singleton instance
const instructorsStore = new InstructorsStore();
export default instructorsStore;