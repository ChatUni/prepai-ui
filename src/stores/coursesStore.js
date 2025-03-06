import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import { getAllCourses, getAllInstructors } from '../utils/db';

class CoursesStore {
  courses = [];
  instructors = [];
  isLoading = true;
  error = null;

  constructor() {
    this.fetchCourses();
    this.fetchInstructors();
    makeObservable(this, {
      courses: observable,
      instructors: observable,
      isLoading: observable,
      error: observable,
      fetchCourses: action,
      fetchInstructors: action,
      setCourses: action,
      setInstructors: action,
      setError: action,
      setLoading: action,
      filteredCourses: computed,
      popularCourses: computed,
      examCourses: computed
    });
  }

  async fetchCourses() {
    this.setLoading(true);
    this.setError(null);
    
    try {
      const courses = await getAllCourses();
      console.log('Fetched courses:', courses);
      console.log('Number of courses:', courses.length);
      this.setCourses(courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      this.setError('Failed to load courses from database');
      
      // Fallback to empty array if there's an error
      this.setCourses([]);
    } finally {
      this.setLoading(false);
    }
  }

  async fetchInstructors() {
    try {
      const instructors = await getAllInstructors();
      console.log('Fetched instructors:', instructors);
      this.setInstructors(instructors);
    } catch (error) {
      console.error('Failed to fetch instructors:', error);
      // Keep any existing instructors in case of error
      if (this.instructors.length === 0) {
        this.setError('Failed to load instructors from database');
      }
    }
  }

  setCourses(courses) {
    runInAction(() => {
      // Process courses to ensure they have all required fields
      this.courses = courses.map(course => ({
        ...course,
        keywords: course.keywords || '',
        duration: course.duration || '00:00',
        isFavorite: !!course.isFavorite,
        recommended: !!course.recommended,
        isVideo: course.isVideo === undefined ? true : !!course.isVideo,
        transcript: course.transcript || ''
      }));
      
      // Update favorites in uiStore
      if (uiStore.setFavorites) {
        uiStore.setFavorites(this.courses);
      }
    });
  }

  setInstructors(instructors) {
    runInAction(() => {
      this.instructors = instructors;
    });
  }

  setError(error) {
    runInAction(() => {
      this.error = error;
    });
  }

  setLoading(isLoading) {
    runInAction(() => {
      this.isLoading = isLoading;
    });
  }

  get filteredCourses() {
    const searchKeyword = uiStore.searchKeyword.toLowerCase();
    const activeCategory = uiStore.activeCategory;
    const selectedInstructorId = uiStore.selectedInstructorId;

    // If we're on the exam page, return filtered exam courses
    if (activeCategory === "考测") {
      return this.examCourses.filter(course => {
        const matchesSearch = !searchKeyword ||
          course.title.toLowerCase().includes(searchKeyword) ||
          course.instructor.toLowerCase().includes(searchKeyword);

        const matchesInstructor = selectedInstructorId === null ||
          course.instructor === this.instructors.find(instructor => instructor.id === selectedInstructorId)?.name;

        return matchesSearch && matchesInstructor;
      });
    }

    // Original filtering logic for other pages
    const courseTypeFilter = uiStore.courseTypeFilter;
    return this.courses.filter(course => {
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        course.instructor.toLowerCase().includes(searchKeyword);

      // Filter by course type (video or document)
      const matchesCourseType = course.isVideo === courseTypeFilter;

      // Special handling for different categories
      let matchesCategory = false;
      
      if (!activeCategory) {
        // No category filter
        matchesCategory = true;
      } else if (activeCategory === "视频课程") {
        // Show all video courses for "视频课程"
        matchesCategory = true;
      } else if (activeCategory === "文档课程") {
        // Show all document courses for "文档课程"
        matchesCategory = true;
      } else if (activeCategory === "视频推荐" || activeCategory === "文档推荐") {
        // Show only recommended courses for the respective type
        matchesCategory = course.recommended === true;
      } else if (activeCategory === "视频收藏" || activeCategory === "文档收藏") {
        // Show only favorited courses
        matchesCategory = uiStore.favoriteCourseIds.has(course.id);
      } else if (activeCategory === "视频历史" || activeCategory === "文档历史") {
        // For now, treat history same as all courses for the respective type
        matchesCategory = true;
      } else {
        // Normal category matching
        matchesCategory = course.category === activeCategory;
      }

      const matchesInstructor = selectedInstructorId === null ||
        course.instructor === this.instructors.find(instructor => instructor.id === selectedInstructorId)?.name;

      return matchesSearch && matchesCategory && matchesInstructor && matchesCourseType;
    });
  }

  get popularCourses() {
    // Sort courses by viewCount in descending order
    const sortedCourses = [...this.courses].sort((a, b) => b.viewCount - a.viewCount);
    
    // Get the top 4 courses, ensuring each course appears only once
    const uniqueIds = new Set();
    const topCourses = [];
    
    for (const course of sortedCourses) {
      if (!uniqueIds.has(course.id)) {
        uniqueIds.add(course.id);
        topCourses.push(course);
        
        if (topCourses.length >= 4) {
          break;
        }
      }
    }
    
    return topCourses;
  }

  get examCourses() {
    // Sort courses by date_added in descending order
    return [...this.courses].sort((a, b) => {
      const dateA = new Date(a.date_added);
      const dateB = new Date(b.date_added);
      return dateB - dateA;
    });
  }

  // Removed circular reference getter
}

const coursesStore = new CoursesStore();
export default coursesStore;

// This will be defined later
let uiStore = { searchKeyword: '', activeCategory: '' };

// Import and set the uiStore after it's created to avoid circular dependencies
export const setUIStore = (store) => {
  uiStore = store;
};
