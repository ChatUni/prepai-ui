import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import { getAllCourses, getAllInstructors, getAllSeries, fetchFromApi } from '../utils/db';
import languageStore from './languageStore';
import clientStore from './clientStore';

class CoursesStore {
  courses = [];
  instructors = [];
  instructorSeries = [];
  isLoading = true;
  isLoadingInstructorSeries = false;
  error = null;
  instructorSeriesError = null;
  selectedSeriesId = null;
  selectedInstructorId = null;

  constructor() {
    makeObservable(this);
  }

  setCourses(courses) {
    runInAction(() => {
      // Format courses to ensure instructor data is properly structured
      this.courses = courses;
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

  setSelectedSeriesId(seriesId) {
    runInAction(() => {
      this.selectedSeriesId = seriesId;
    });
  }

  setSelectedInstructorId(instructorId) {
    runInAction(() => {
      this.selectedInstructorId = instructorId;
    });
  }
  
  // Set instructor ID and fetch their series in one action
  selectInstructor(instructorId) {
    this.setSelectedInstructorId(instructorId);
    if (instructorId) {
      this.fetchInstructorSeries(instructorId);
    } else {
      this.setInstructorSeries([]);
    }
  }
  
  // Load series by ID in one action
  selectSeries(seriesId) {
    this.setSelectedSeriesId(seriesId);
    // If we have a specific seriesId, we can fetch additional details if needed
  }

  setInstructorSeries(series) {
    runInAction(() => {
      this.instructorSeries = series;
    });
  }

  setInstructorSeriesError(error) {
    runInAction(() => {
      this.instructorSeriesError = error;
    });
  }

  setLoadingInstructorSeries(isLoading) {
    runInAction(() => {
      this.isLoadingInstructorSeries = isLoading;
    });
  }

  get filteredCourses() {
    // Safely access uiStore properties with defaults
    const searchKeyword = (uiStore.searchKeyword || '').toLowerCase();
    const activeCategory = uiStore.activeCategory || '';
    const selectedInstructorId = uiStore.selectedInstructorId || null;
    const selectedSeriesId = uiStore.selectedSeriesId || null;

    const { t } = languageStore;
    
    // If we're on the exam page (checking nav item instead of category)
    if (uiStore.activeNavItem === 'testing') {
      return this.examCourses.filter(course => {
        const matchesSearch = !searchKeyword ||
          course.title.toLowerCase().includes(searchKeyword) ||
          (typeof course.instructor === 'string'
            ? course.instructor.toLowerCase().includes(searchKeyword)
            : course.instructor?.name?.toLowerCase().includes(searchKeyword)) ||
          (course.series?.name && course.series?.name.toLowerCase().includes(searchKeyword));

        const selectedInstructor = this.instructors.find(instructor => instructor.id === selectedInstructorId);
        const matchesInstructor = !selectedInstructorId ||
          (typeof course.instructor === 'string' ? course.instructor === selectedInstructor?.name : course.instructor?.name === selectedInstructor?.name);
        const matchesSeries = selectedSeriesId === null || course.series?.id === selectedSeriesId;

        return matchesSearch && matchesInstructor && matchesSeries;
      });
    }

    // Original filtering logic for other pages
    return this.courses.filter(course => {
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        (course.instructor?.name && course.instructor?.name.toLowerCase().includes(searchKeyword)) ||
        (course.series?.name && course.series?.name.toLowerCase().includes(searchKeyword));

      // Always filter by course type using constant identifiers
      const matchesCourseType = activeCategory && typeof activeCategory === 'string'
        ? activeCategory.includes(course.isVideo ? 'video' : 'document')
        : true; // If no active category, don't filter by course type

      // Special handling for different categories
      let matchesCategory = false;
      
      if (!activeCategory) {
        // No category filter
        matchesCategory = true;
      } else if (activeCategory === 'videoCourses') {
        // Show all video courses
        matchesCategory = true;
      } else if (activeCategory === 'documentCourses') {
        // Show all document courses
        matchesCategory = true;
      } else if (activeCategory === 'recommended') {
        // Show only recommended courses
        matchesCategory = course.recommended === true;
      } else if (activeCategory === 'favorites') {
        // Show only favorited courses
        matchesCategory = uiStore.favoriteCourseIds ? uiStore.favoriteCourseIds.has(course.id) : false;
      } else if (activeCategory === 'playHistory') {
        // For now, treat history same as all courses
        matchesCategory = true;
      } else {
        // Normal category matching
        matchesCategory = course.category === activeCategory;
      }

      const matchesInstructor = selectedInstructorId === null ||
        course.instructor?.name === this.instructors.find(instructor => instructor.id === selectedInstructorId)?.name;

      const matchesSeries = selectedSeriesId === null || course.series?.id === selectedSeriesId;

      return matchesSearch && matchesCategory && matchesInstructor && matchesCourseType && matchesSeries;
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

  get filteredInstructors() {
    const searchKeyword = (uiStore.searchKeyword || '').toLowerCase();
    
    if (!searchKeyword) {
      return this.instructors;
    }
    
    return this.instructors.filter(instructor =>
      (instructor.name || '').toLowerCase().includes(searchKeyword) ||
      (instructor.bio || '').toLowerCase().includes(searchKeyword)
    );
  }  
}

const coursesStore = new CoursesStore();
export default coursesStore;
