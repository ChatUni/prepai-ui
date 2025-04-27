import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import { getAllCourses, getAllInstructors, getAllSeries, fetchFromApi } from '../utils/db';
import { tap } from '../../netlify/functions/utils';
import languageStore from './languageStore';

class CoursesStore {
  courses = [];
  instructors = [];
  series = [];
  instructorSeries = [];
  isLoading = true;
  isLoadingInstructorSeries = false;
  error = null;
  instructorSeriesError = null;
  selectedSeriesId = null;
  selectedInstructorId = null;

  constructor() {
    this.fetchCourses();
    this.fetchInstructors();
    makeObservable(this, {
      courses: observable,
      instructors: observable,
      series: observable,
      instructorSeries: observable,
      isLoading: observable,
      isLoadingInstructorSeries: observable,
      error: observable,
      instructorSeriesError: observable,
      selectedSeriesId: observable,
      selectedInstructorId: observable,
      fetchCourses: action,
      fetchInstructors: action,
      fetchSeries: action,
      fetchInstructorSeries: action,
      setCourses: action,
      setInstructors: action,
      setSeries: action,
      setInstructorSeries: action,
      setError: action,
      setInstructorSeriesError: action,
      setLoading: action,
      setLoadingInstructorSeries: action,
      setSelectedSeriesId: action,
      setSelectedInstructorId: action,
      filteredCourses: computed,
      filteredInstructors: computed,
      filteredSeries: computed,
      popularCourses: computed,
      examCourses: computed,
      coursesBySeries: computed,
      getSeriesInstructors: computed,
      uniqueCategories: computed,
      seriesCovers: computed
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
      this.setInstructors([]);
    }
  }

  async fetchSeries() {
    try {
      // Use the getAllSeries utility function for consistent API access
      const series = await getAllSeries();
      console.log('Fetched series:', series);      
      this.setSeries(series);
    } catch (error) {
      console.error('Failed to fetch series:', error);
      console.warn('Using fallback empty series array');
      this.setSeries([]);
    }
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

  setSeries(series) {
    runInAction(() => {
      this.series = series;
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

  // Fetch series for a specific instructor
  async fetchInstructorSeries(instructorId) {
    if (!instructorId) return;
    
    this.setLoadingInstructorSeries(true);
    this.setInstructorSeriesError(null);
    
    try {
      // Use the fetchFromApi utility to maintain consistent API access
      const series = await fetchFromApi(`/series?instructorId=${instructorId}`);
      console.log('Fetched instructor series:', series);
      this.setInstructorSeries(series);
    } catch (error) {
      console.error('Failed to fetch instructor series:', error);
      this.setInstructorSeriesError(error.message);
      this.setInstructorSeries([]);
    } finally {
      this.setLoadingInstructorSeries(false);
    }
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
  
  get filteredSeries() {
    if (!Array.isArray(this.series)) {
      console.error('series is not an array:', this.series);
      return [];
    }
    
    const searchKeyword = (uiStore.searchKeyword || '').toLowerCase();
    const selectedInstructorId = uiStore.selectedInstructorId || null;
    const activeCategory = uiStore.activeCategory || '';
    
    return this.series.filter(series => {
      // Skip any non-object series items
      if (!series || typeof series !== 'object') {
        console.error('Invalid series item:', series);
        return false;
      }
      
      const matchesSearch = !searchKeyword ||
        (typeof series.name === 'string' && series.name.toLowerCase().includes(searchKeyword)) ||
        (typeof series.desc === 'string' && series.desc.toLowerCase().includes(searchKeyword)) ||
        (series.instructor && typeof series.instructor.name === 'string' && series.instructor.name.toLowerCase().includes(searchKeyword));
      
      const matchesInstructor = selectedInstructorId === null ||
        (series.instructor && series.instructor.id === selectedInstructorId);

      const matchesCategory = !activeCategory || series.category === activeCategory;
      
      return matchesSearch && matchesInstructor && matchesCategory;
    });
  }

  get coursesBySeries() {
    // Group courses by series
    const groupedCourses = {};
    
    this.series.forEach(series => {
      groupedCourses[series.id] = this.courses.filter(course => course.series?.id === series.id);
    });
    
    return groupedCourses;
  }

  get getSeriesInstructors() {
    return (series) => {
      if (!series || !series.id) return [];
      
      // Get all courses for this series
      const seriesCourses = this.courses.filter(course =>
        course?.series?.id === series.id || course?.series?._id === series.id
      );

      // Extract unique instructor IDs from the courses
      const instructorIds = new Set(
        seriesCourses
          .map(course => course.instructor_id)
          .filter(id => id) // Filter out any undefined/null values
      );

      // Get the instructor objects for these IDs
      return Array.from(instructorIds)
        .map(id => this.instructors.find(instructor => instructor.id === id || instructor._id === id))
        .filter(instructor => instructor); // Filter out any undefined instructors
    };
  }

  get uniqueCategories() {
    const categories = this.series
      .map(series => series.category)
      .filter(category => category); // Filter out null/undefined
    return [...new Set(categories)].sort();
  }

  get seriesCovers() {
    return this.series
      .filter(series => typeof series.cover === 'string')
      .map(series => series.cover);
  }
}

const coursesStore = new CoursesStore();
export default coursesStore;

// This will be defined later
let uiStore = { searchKeyword: '', activeCategory: '', activeNavItem: '' };

// Import and set the uiStore after it's created to avoid circular dependencies
export const setUIStore = (store) => {
  if (!store) {
    console.error('Attempted to set undefined uiStore');
    return;
  }
  uiStore = store;
};
