import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import SeriesList from './ui/SeriesList';
import CourseList from './ui/CourseList';
import SearchBar from './ui/SearchBar';
import coursesStore from '../stores/coursesStore';
import routeStore from '../stores/routeStore';
import uiStore from '../stores/uiStore';
import languageStore from '../stores/languageStore';
import carouselStore from '../stores/carouselStore';
import { tap } from '../../netlify/functions/utils';

const SeriesPage = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;
  const [activeTab, setActiveTab] = React.useState('about'); // 'about' or 'courses'

  // Start carousel rotation when on series list page
  useEffect(() => {
    const shouldStartCarousel = !routeStore.seriesId && coursesStore.series.length > 0;
    if (shouldStartCarousel) {
      carouselStore.startRotation();
    }
    return () => carouselStore.cleanup();
  }, [routeStore.seriesId, coursesStore.series.length]);
  
  // Load series data if not already loaded
  useEffect(() => {
    if (coursesStore.series.length === 0) {
      coursesStore.fetchSeries();
    }
  }, []); // Empty dependency array means this only runs once on mount
  
  // Access current series from routeStore
  const selectedSeries = routeStore.currentSeries;
  
  // Get courses for this series, making sure to include all courses regardless of type
  const seriesCourses = selectedSeries ?
    coursesStore.courses.filter(course => {
      // Always filter by series ID
      const matchesSeries = course.series?.id === selectedSeries.id;

      // Apply instructor filter if one is selected
      const selectedInstructorId = uiStore?.selectedInstructorId;
      const matchesInstructor = !selectedInstructorId ||
        course.instructor?.id === selectedInstructorId ||
        course.instructor?.name === coursesStore.instructors.find(i => i.id === selectedInstructorId)?.name;
      
      // Apply search filter if there's a search keyword
      const searchKeyword = uiStore?.searchKeyword?.toLowerCase() || '';
      const matchesSearch = !searchKeyword ||
        course.title.toLowerCase().includes(searchKeyword) ||
        (course.instructor?.name && course.instructor?.name.toLowerCase().includes(searchKeyword)) ||
        (course.description && course.description.toLowerCase().includes(searchKeyword));
      
      // Don't filter by course type (isVideo) here, we want to show all courses in the series
      return matchesSeries && matchesInstructor && matchesSearch;
    }) :
    [];

  // If a series is selected, display its courses
  if (routeStore.seriesId) {
    
    const handleBackClick = () => {
      // If we came from an instructor page, we'll go back to that instructor
      if (selectedSeries?.instructor?.id) {
        routeStore.navigateToInstructor(selectedSeries.instructor?.id, navigate);
      } else {
        // Otherwise, go to the main series page
        navigate('/series');
        routeStore.setSeriesId(null);
      }
    };

    return (
      <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackClick}
            className="mr-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold">{selectedSeries?.name || selectedSeries?.id || 'Series'}</h1>
          </div>
        </div>
        
        {selectedSeries && (
          <>
            {/* Series cover image */}
            <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                {typeof selectedSeries.cover === 'string' ? (
                  <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
                    <img
                      src={selectedSeries.cover}
                      alt={selectedSeries.name || ''}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative pb-[56.25%] bg-gray-200 dark:bg-gray-700"> {/* 16:9 aspect ratio */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">{t('series.noCover')}</span>
                    </div>
                  </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === 'about'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('about')}
              >
                {t('series.aboutThisSeries')}
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === 'courses'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('courses')}
              >
                {t('series.courseList')}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'about' ? (
              <div>
                {/* Series description */}
                <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {typeof selectedSeries.desc === 'string' ? selectedSeries.desc : 'No description available for this series.'}
                  </p>
                </div>
                
                {/* Instructor info */}
                {selectedSeries.instructor && (
                  <div className="flex items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex-shrink-0">
                      {selectedSeries.instructor.iconUrl ? (
                        <img
                          src={selectedSeries.instructor.iconUrl}
                          alt={selectedSeries.instructor.name}
                          className="w-12 h-12 rounded-full mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 mr-4 flex items-center justify-center">
                          <span className="text-xl text-gray-600">{selectedSeries.instructor.name?.[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedSeries.instructor.name}</h3>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <CourseList
                courses={seriesCourses}
              />
            )}
          </>
        )}
      </div>
    );
  }
  
  // Get selected instructor details
  const selectedInstructor = uiStore.selectedInstructorId ?
    coursesStore.instructors.find(i => i.id === uiStore.selectedInstructorId) :
    null;

  // Otherwise, display all available series
  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {/* Carousel */}
      {carouselStore.images.length > 0 && (
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg relative">
          <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
            <img
              src={carouselStore.images[carouselStore.currentImageIndex]}
              alt="Series Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          {carouselStore.images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {carouselStore.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === carouselStore.currentImageIndex
                      ? 'bg-white'
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tools Navigation */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/favorites')}>
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-2 hover:bg-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('tools.purchasedCourses')}</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/series')}>
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-2 hover:bg-emerald-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('tools.courseCategories')}</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/account')}>
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-2 hover:bg-amber-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('tools.myMessages')}</span>
        </div>
      </div>

      {/* Add instructor filter and search box */}
      <div className="mb-6">
        <SearchBar />
      </div>

      {/* Show instructor card if one is selected */}
      {selectedInstructor && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {selectedInstructor.iconUrl ? (
                <img
                  src={selectedInstructor.iconUrl}
                  alt={selectedInstructor.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4 flex items-center justify-center">
                  <span className="text-xl text-gray-600">{selectedInstructor.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{selectedInstructor.name}</h3>
            </div>
          </div>
        </div>
      )}
      
      {coursesStore.isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-400">{t('series.loading')}</p>
        </div>
      ) : (
        <>
          {!Array.isArray(coursesStore.filteredSeries) ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">{t('series.loadingError')}</p>
            </div>
          ) : coursesStore.filteredSeries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">{t('series.noSeries')}</p>
            </div>
          ) : (
            <SeriesList title="" series={coursesStore.filteredSeries} isAllInstructors={true} />
          )}
        </>
      )}
    </div>
  );
});

export default SeriesPage;