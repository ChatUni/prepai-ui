import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import { getAllCourses, getAllInstructors, getAllSeries, fetchFromApi } from '../utils/db';

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
    this.fetchSeries();
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
      coursesBySeries: computed
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
      console.warn('Using fallback data in development mode');
      
      // Add mock instructor data for development
      const mockInstructors = [
        {
          id: 1,
          name: '宋浩',
          position: '高等数学教授',
          institution: '北京大学',
          image: 'https://randomuser.me/api/portraits/men/32.jpg',
          description: '高等数学专家，拥有20年教学经验'
        },
        {
          id: 2,
          name: '李明',
          position: '量子物理学教授',
          institution: '清华大学',
          image: 'https://randomuser.me/api/portraits/men/33.jpg',
          description: '量子物理学专家，研究领域包括量子计算和量子信息'
        }
      ];
      
      this.setInstructors(mockInstructors);
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
      // Process courses to ensure they have all required fields
      this.courses = courses.map(course => ({
        ...course,
        keywords: course.keywords || '',
        duration: course.duration || '00:00',
        isFavorite: !!course.isFavorite,
        recommended: !!course.recommended,
        isVideo: course.isVideo === undefined ? true : !!course.isVideo,
        transcript: course.transcript || '',
        series_name: course.series_name || 'Uncategorized' // Add series name if available
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
      const series = await fetchFromApi(`/series?instructor=${instructorId}`);
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
    const searchKeyword = uiStore.searchKeyword.toLowerCase();
    const activeCategory = uiStore.activeCategory;
    const selectedInstructorId = uiStore.selectedInstructorId;
    const selectedSeriesId = this.selectedSeriesId;

    // If we're on the exam page, return filtered exam courses
    if (activeCategory === "考测") {
      return this.examCourses.filter(course => {
        const matchesSearch = !searchKeyword ||
          course.title.toLowerCase().includes(searchKeyword) ||
          (course.instructor && course.instructor.toLowerCase().includes(searchKeyword)) ||
          (course.series_name && course.series_name.toLowerCase().includes(searchKeyword));

        const matchesInstructor = selectedInstructorId === null ||
          course.instructor === this.instructors.find(instructor => instructor.id === selectedInstructorId)?.name;

        const matchesSeries = selectedSeriesId === null || course.series_id === selectedSeriesId;

        return matchesSearch && matchesInstructor && matchesSeries;
      });
    }

    // Original filtering logic for other pages
    const courseTypeFilter = uiStore.courseTypeFilter;
    return this.courses.filter(course => {
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        (course.instructor && course.instructor.toLowerCase().includes(searchKeyword)) ||
        (course.series_name && course.series_name.toLowerCase().includes(searchKeyword));

      // Filter by course type (video or document), but ONLY if not viewing a specific series
      // When viewing a specific series, we want to show all courses in that series
      const matchesCourseType = this.selectedSeriesId
        ? true // Don't filter by type when a series is selected
        : course.isVideo === courseTypeFilter;

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
        course.instructor_name === this.instructors.find(instructor => instructor.id === selectedInstructorId)?.name;

      const matchesSeries = selectedSeriesId === null || course.series_id === selectedSeriesId;

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
    const searchKeyword = uiStore.searchKeyword.toLowerCase();
    
    if (!searchKeyword) {
      return this.instructors;
    }
    
    return this.instructors.filter(instructor =>
      instructor.name.toLowerCase().includes(searchKeyword) ||
      instructor.description.toLowerCase().includes(searchKeyword)
    );
  }
  
  get filteredSeries() {
    const searchKeyword = uiStore.searchKeyword.toLowerCase();
    const selectedInstructorId = uiStore.selectedInstructorId;
    
    return this.series.filter(series => {
      const matchesSearch = !searchKeyword || 
        series.name.toLowerCase().includes(searchKeyword) ||
        (series.desc && series.desc.toLowerCase().includes(searchKeyword)) ||
        (series.instructor_name && series.instructor_name.toLowerCase().includes(searchKeyword));
      
      const matchesInstructor = selectedInstructorId === null || 
        series.instructor_id === selectedInstructorId;
      
      return matchesSearch && matchesInstructor;
    });
  }

  get coursesBySeries() {
    // Group courses by series
    const groupedCourses = {};
    
    this.series.forEach(series => {
      groupedCourses[series.id] = this.courses.filter(course => course.series_id === series.id);
    });
    
    return groupedCourses;
  }
}

const coursesStore = new CoursesStore();
export default coursesStore;

// This will be defined later
let uiStore = { searchKeyword: '', activeCategory: '' };

// Import and set the uiStore after it's created to avoid circular dependencies
export const setUIStore = (store) => {
  uiStore = store;
};
