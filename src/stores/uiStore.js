import { makeObservable, observable, action, runInAction } from 'mobx';
import { getApiBaseUrl } from '../config.js';
import languageStore from './languageStore';

class UIStore {
  searchKeyword = '';
  activeNavItem = '';
  activeCategory = '';
  selectedInstructorId = null;
  isInstructorDropdownOpen = false;
  isCategoryDropdownOpen = false;
  favoriteCourseIds = new Set(); // Store favorite course IDs
  userId = 1; // Default user ID for development
  courseTypeFilter = true; // Default to video courses (true = video, false = document)
  selectedSeriesId = null; // Track selected series ID
  mode = ''; // Current mode (e.g., 'exam', 'select', etc.)
  
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
      activeNavItem: observable,
      activeCategory: observable,
      selectedInstructorId: observable,
      isInstructorDropdownOpen: observable,
      isCategoryDropdownOpen: observable,
      favoriteCourseIds: observable,
      userId: observable,
      courseTypeFilter: observable,
      selectedSeriesId: observable,
      userInfo: observable,
      mode: observable,
      setSearchKeyword: action,
      setSelectedSeriesId: action,
      setActiveNavItem: action,
      setActiveCategory: action,
      setSelectedInstructorId: action,
      setInstructorDropdownOpen: action,
      setCategoryDropdownOpen: action,
      closeAllDropdowns: action,
      toggleFavorite: action,
      setFavorites: action,
      setCourseTypeFilter: action,
      updateUserInfo: action,
      resetFilters: action,
      setMode: action
    });

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
      const favoriteIds = new Set(favorites.map(f => f.course_id));

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
  }

  // Dropdown controls
  setInstructorDropdownOpen(isOpen) {
    this.isInstructorDropdownOpen = isOpen;
    if (isOpen) {
      this.isCategoryDropdownOpen = false;
    }
  }

  setCategoryDropdownOpen(isOpen) {
    this.isCategoryDropdownOpen = isOpen;
    if (isOpen) {
      this.isInstructorDropdownOpen = false;
    }
  }

  closeAllDropdowns() {
    this.isInstructorDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
  }

  // Set active category and close dropdowns
  setActiveCategory(category) {
    this.activeCategory = category;
    this.closeAllDropdowns();
  }

  // Set current mode
  setMode(mode) {
    this.mode = mode;
  }
}

const uiStore = new UIStore();
export default uiStore;
