import { makeObservable, observable, action, runInAction } from 'mobx';
import { setUIStore } from './coursesStore';
import { getApiBaseUrl } from '../config.js';
import { tap } from '../../netlify/functions/utils/index.js';

class UIStore {
  searchKeyword = '';
  activeCategory = '私教'; // Default to '私教' (Private Tutoring)
  activeNavItem = '私教'; // Default to '私教' (Private Tutoring)
  selectedInstructorId = null;
  favoriteCourseIds = new Set(); // Store favorite course IDs
  userId = 1; // Default user ID for development
  courseTypeFilter = true; // Default to video courses (true = video, false = document)
  parentCategory = null; // Track parent category for subcategories
  selectedSeriesId = null; // Track selected series ID
  
  // User account information
  userInfo = {
    username: '游客', // Default username (Guest)
    userId: '53',     // User ID
    gender: 'male',   // User gender
    avatar: 'https://via.placeholder.com/150', // Placeholder avatar URL
    vipExpiry: '2025-12-27 10:33:52', // VIP expiry date
  };

  constructor() {
    makeObservable(this, {
      searchKeyword: observable,
      activeCategory: observable,
      activeNavItem: observable,
      selectedInstructorId: observable,
      favoriteCourseIds: observable,
      userId: observable,
      courseTypeFilter: observable,
      parentCategory: observable,
      selectedSeriesId: observable,
      userInfo: observable,
      setSearchKeyword: action,
      setSelectedSeriesId: action,
      setActiveCategory: action,
      setActiveNavItem: action,
      setSelectedInstructorId: action,
      toggleFavorite: action,
      setFavorites: action,
      setCourseTypeFilter: action,
      setParentCategory: action,
      updateUserInfo: action,
      resetFilters: action
    });

    // Set this store in coursesStore to avoid circular dependencies
    setUIStore(this);
    
    // Load favorites from API
    this.loadFavorites();
  }
  
  // Load favorites from API
  async loadFavorites() {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/favorites?userId=${this.userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const favorites = await response.json();
      const favoriteIds = new Set(favorites.map(course => course.id));

      runInAction(() => {
        this.favoriteCourseIds = favoriteIds;
      });
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  setSearchKeyword(keyword) {
    this.searchKeyword = keyword;
  }

  setActiveCategory(category) {
    this.activeCategory = category;
  }

  setActiveNavItem(item) {
    this.activeNavItem = item;
  }

  setSelectedInstructorId(instructorId) {
    this.selectedInstructorId = instructorId;
  }
  
  // Toggle favorite status for a course
  async toggleFavorite(courseId) {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/favorites/toggle?userId=${this.userId}&courseId=${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }
      
      const result = await response.json();
      
      runInAction(() => {
        if (result.isFavorite) {
          this.favoriteCourseIds.add(courseId);
        } else {
          this.favoriteCourseIds.delete(courseId);
        }
      });
      
      return result.isFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return null;
    }
  }
  
  // Set favorites from API response
  setFavorites(courses) {
    const favoriteIds = new Set(
      courses
        .filter(course => course.isFavorite)
        .map(course => course.id)
    );
    
    this.favoriteCourseIds = favoriteIds;
  }
  
  // Check if a course is favorited
  isFavorite(courseId) {
    return this.favoriteCourseIds.has(courseId);
  }
  
  // Set course type filter (video=true, document=false)
  setCourseTypeFilter(isVideo) {
    this.courseTypeFilter = isVideo;
  }
  
  // Set parent category for sub-menu items
  setParentCategory(category) {
    this.parentCategory = category;
  }
  // Update user information
  updateUserInfo(newUserInfo) {
    this.userInfo = {
      ...this.userInfo,
      ...newUserInfo
    };
  }

  // Set selected series ID
  setSelectedSeriesId(seriesId) {
    this.selectedSeriesId = seriesId;
  }

  // Reset all filters to their default state
  resetFilters() {
    this.searchKeyword = '';
    this.selectedInstructorId = null;
    this.selectedSeriesId = null;
    this.parentCategory = null;
  }
}

const uiStore = new UIStore();
export default uiStore;
