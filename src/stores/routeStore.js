import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import coursesStore from './coursesStore';
import uiStore from './uiStore';
import { tap } from '../../netlify/functions/utils';

class RouteStore {
  // Route parameters
  instructorId = null;
  seriesId = null;
  courseId = null;
  currentPath = '';
  
  constructor() {
    makeObservable(this, {
      instructorId: observable,
      seriesId: observable,
      courseId: observable,
      currentPath: observable,
      
      // Actions to update route parameters
      setInstructorId: action,
      setSeriesId: action,
      setCourseId: action,
      
      // Computed properties that derive state from route parameters
      currentInstructor: computed,
      currentSeries: computed,
      currentCourse: computed,
      isTopLevelPage: computed,
      isSeriesSelectMode: computed,
      isSeriesExamMode: computed,
      isSeriesListMode: computed,
      
      // Navigation actions that coordinate with the store
      navigateToInstructor: action,
      navigateToSeries: action,
      navigateToCourse: action,
      navigateToSeriesWithInstructor: action
    });
  }
  
  // Update route parameters
  setInstructorId(id) {
    this.instructorId = id ? parseInt(id, 10) : null;
    
    // When instructor changes, load their series
    if (this.instructorId) {
      coursesStore.selectInstructor(this.instructorId);
    }
  }
  
  setSeriesId(id) {
    this.seriesId = id ? parseInt(id, 10) : null;
    
    // When series changes, update selected series in coursesStore
    if (this.seriesId) {
      coursesStore.selectSeries(this.seriesId);
    }
  }
  
  setCourseId(id) {
    this.courseId = id ? parseInt(id, 10) : null;
  }
  
  // Computed properties for current entities based on route parameters
  get currentInstructor() {
    if (!this.instructorId) return null;
    return coursesStore.instructors.find(instructor => instructor.id === this.instructorId);
  }
  
  get currentSeries() {
    if (!this.seriesId) return null;
    const series = coursesStore.series.find(series =>
      series && (series.id === this.seriesId || series._id === this.seriesId)
    );
    
    if (!series) return null;
    
    // Ensure we return a properly formatted series object
    return {
      id: series.id || series._id,
      name: typeof series.name === 'string' ? series.name : '',
      desc: typeof series.desc === 'string' ? series.desc : '',
      cover: typeof series.cover === 'string' ? series.cover : '',
      category: typeof series.category === 'string' ? series.category : '',
      instructor: series.instructor
    };
  }
  
  get currentCourse() {
    if (!this.courseId) return null;
    return coursesStore.courses.find(course => course.id === this.courseId);
  }

  // Determine if current page is a top-level page
  get isTopLevelPage() {
    const pathSegments = this.getPathSegments();
    if (pathSegments.length === 0) return true;
    
    const topLevelRoutes = ['exam', 'series', 'assistants', 'account'];
    const firstSegment = pathSegments[0];
    
    return topLevelRoutes.includes(firstSegment) && pathSegments.length === 1;
  }

  // Determine if current page is series list mode (/ or /series)
  get isSeriesListMode() {
    const pathSegments = this.getPathSegments();
    return this.currentPath === '/' || (pathSegments.length === 1 && pathSegments[0] === 'series');
  }

  // Determine if current page is series select mode
  get isSeriesSelectMode() {
    const pathSegments = this.getPathSegments();
    return pathSegments.length === 2 && pathSegments[0] === 'series' && pathSegments[1] === 'select';
  }

  // Determine if current page is series exam mode
  get isSeriesExamMode() {
    const pathSegments = this.getPathSegments();
    return pathSegments.length === 1 && pathSegments[0] === 'exam';
  }
  
  getPathSegments() {
    return this.currentPath.split('/').filter(Boolean);
  }

  // Methods to handle navigation with store updates
  navigateToInstructor(instructorId, navigate) {
    this.setInstructorId(instructorId);
    if (navigate) navigate(`/instructor/${instructorId}`);
  }
  
  navigateToSeries(seriesId, navigate) {
    // First navigate to ensure the URL changes
    if (navigate) navigate(`/series/${seriesId}`);
    
    // Then update the store state to match the new URL
    // Use action wrappers for all state changes
    runInAction(() => {
      // Don't clear instructor ID when navigating from an instructor page
      // This preserves context when navigating from instructor to their series
      
      // Set the series ID
      this.setSeriesId(seriesId);
    });
    
    // Ensure series is selected in the courses store
    coursesStore.selectSeries(seriesId);
    
    // Important: Make sure we have courses loaded for this series
    if (seriesId && coursesStore.courses.length === 0) {
      // If courses haven't been loaded yet, fetch them
      coursesStore.fetchCourses();
    }
    
    // If we have series data and this series has an instructor, make sure that data is loaded
    if (seriesId && coursesStore.series.length > 0) {
      const series = coursesStore.series.find(s => s.id === parseInt(seriesId, 10));
      if (series && series.instructor?.id) {
        // Load any related data for display purposes, but don't set as current instructor
        coursesStore.fetchInstructorSeries(series.instructor?.id);
      }
    }
  }
  
  navigateToCourse(courseId, isVideo, navigate) {
    this.setCourseId(courseId);
    if (navigate) {
      if (isVideo) {
        navigate(`/video/${courseId}`);
      } else {
        navigate(`/ppt/${courseId}`);
      }
    }
  }
  
  // Sync route store with current location
  syncWithLocation(location) {
    // Use runInAction to batch all state changes
    runInAction(() => {
      this.currentPath = location.pathname;
      const pathSegments = location.pathname.split('/').filter(Boolean);
      
      // Clear all IDs by default
      this.instructorId = null;
      this.seriesId = null;
      this.courseId = null;
      
      if (pathSegments.length >= 2) {
        const [routeType, routeId] = pathSegments;
        
        // Set appropriate ID based on route type
        switch (routeType) {
          case 'instructor':
            this.setInstructorId(routeId);
            break;
          case 'series':
            if (pathSegments[2] === 'instructor' && pathSegments[3]) {
              // Handle /series/instructor/:id route
              this.setInstructorId(pathSegments[3]);
              uiStore.setSelectedInstructorId(pathSegments[3]);
            } else if (pathSegments[2] && pathSegments[3] === 'edit') {
              // Handle /series/:id/edit route
              this.setSeriesId(pathSegments[2]);
            } else {
              this.setSeriesId(routeId);
            }
            break;
          case 'video':
          case 'ppt':
            this.setCourseId(routeId);
            break;
        }
      }
    });
  }
  // Navigate to series page with instructor selected
  navigateToSeriesWithInstructor(instructorId, navigate) {
    if (navigate) navigate(`/series/instructor/${instructorId}`);
    runInAction(() => {
      this.setInstructorId(instructorId);
      uiStore.setSelectedInstructorId(instructorId);
    });
  }
}

const routeStore = new RouteStore();
export default routeStore;