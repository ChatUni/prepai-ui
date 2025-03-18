import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import SeriesList from './ui/SeriesList';
import CourseList from './ui/CourseList';
import SearchBar from './ui/SearchBar';
import coursesStore from '../stores/coursesStore';
import routeStore from '../stores/routeStore';
import uiStore from '../stores/uiStore';

const SeriesPage = observer(() => {
  const navigate = useNavigate();
  
  // Make sure we load series data if not already loaded
  if (coursesStore.series.length === 0) {
    coursesStore.fetchSeries();
  }
  
  // Access current series from routeStore
  const selectedSeries = routeStore.currentSeries;
  
  // Get courses for this series, making sure to include all courses regardless of type
  const seriesCourses = selectedSeries ?
    coursesStore.courses.filter(course => {
      // Always filter by series ID
      const matchesSeries = course.series_id === selectedSeries.id;
      
      // Apply instructor filter if one is selected
      const selectedInstructorId = uiStore?.selectedInstructorId;
      const matchesInstructor = !selectedInstructorId ||
        course.instructor_id === selectedInstructorId ||
        course.instructor_name === coursesStore.instructors.find(i => i.id === selectedInstructorId)?.name;
      
      // Apply search filter if there's a search keyword
      const searchKeyword = uiStore?.searchKeyword?.toLowerCase() || '';
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        (course.instructor_name && course.instructor_name.toLowerCase().includes(searchKeyword)) ||
        (course.description && course.description.toLowerCase().includes(searchKeyword));
      
      // Don't filter by course type (isVideo) here, we want to show all courses in the series
      return matchesSeries && matchesInstructor && matchesSearch;
    }) :
    [];

  // If a series is selected, display its courses
  if (routeStore.seriesId) {
    
    const handleBackClick = () => {
      // If we came from an instructor page, we'll go back to that instructor
      if (selectedSeries?.instructor_id) {
        routeStore.navigateToInstructor(selectedSeries.instructor_id, navigate);
      } else {
        // Otherwise, go to the main series page
        navigate('/series');
        routeStore.setSeriesId(null);
      }
    };
    
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackClick}
            className="mr-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">{selectedSeries?.name || 'Series'}</h1>
        </div>
        
        {selectedSeries && (
          <div className="mb-8">
            {/* Desktop layout: Flex container for image and info */}
            <div className="flex flex-col md:flex-row md:gap-6">
              {/* Left column: Series cover image */}
              <div className="md:w-1/2 mb-6 md:mb-0 rounded-lg overflow-hidden shadow-lg" style={{ maxHeight: '400px' }}>
                {selectedSeries.cover ? (
                  <img
                    src={selectedSeries.cover}
                    alt={selectedSeries.name}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="bg-gray-200 dark:bg-gray-700 w-full h-48 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">无封面</span>
                  </div>
                )}
              </div>
              
              {/* Right column: Series info and instructor */}
              <div className="md:w-1/2">
                {/* Series description */}
                <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold mb-3">关于这个系列</h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {selectedSeries.desc || 'No description available for this series.'}
                  </p>
                </div>
                
                {/* Instructor info */}
                <div className="flex items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex-shrink-0">
                    {selectedSeries.instructor_avatar ? (
                      <img
                        src={selectedSeries.instructor_avatar}
                        alt={selectedSeries.instructor_name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 mr-4 flex items-center justify-center">
                        <span className="text-xl text-gray-600">{selectedSeries.instructor_name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedSeries.instructor_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">老师</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Course list */}
        <CourseList
          title={'课程列表'}
          courses={seriesCourses}
        />
      </div>
    );
  }
  
  // Otherwise, display all available series
  return (
    <div className="container mx-auto px-4 py-6">      
      {/* Add instructor filter and search box */}
      <div className="mb-6">
        <SearchBar />
      </div>
      
      {coursesStore.isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-400">加载系列课程...</p>
        </div>
      ) : coursesStore.filteredSeries.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-400">没有系列课程</p>
        </div>
      ) : (
        <SeriesList title="" series={coursesStore.filteredSeries} isAllInstructors={true} />
      )}
    </div>
  );
});

export default SeriesPage;