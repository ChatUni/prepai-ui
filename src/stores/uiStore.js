import { makeObservable, observable, action, runInAction } from 'mobx';
import { setUIStore } from './coursesStore';

class UIStore {
  searchKeyword = '';
  activeCategory = '私教'; // Default to '私教' (Private Tutoring)
  activeNavItem = '私教'; // Default to '私教' (Private Tutoring)
  selectedInstructorId = null;
  favoriteCourseIds = new Set(); // Store favorite course IDs
  userId = 1; // Default user ID for development
  courseTypeFilter = true; // Default to video courses (true = video, false = document)
  parentCategory = null; // Track parent category for subcategories

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
      setSearchKeyword: action,
      setActiveCategory: action,
      setActiveNavItem: action,
      setSelectedInstructorId: action,
      toggleFavorite: action,
      setFavorites: action,
      setCourseTypeFilter: action,
      setParentCategory: action
    });

    // Set this store in coursesStore to avoid circular dependencies
    setUIStore(this);
    
    // Load favorites from API
    this.loadFavorites();
  }
  
  // Load favorites from API
  async loadFavorites() {
    try {
      const response = await fetch(`http://localhost:3001/api/favorites?userId=${this.userId}`);
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
      const response = await fetch('http://localhost:3001/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          courseId: courseId
        }),
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
}

const uiStore = new UIStore();
export default uiStore;
