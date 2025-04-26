import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import CourseList from './ui/CourseList';
import coursesStore from '../stores/coursesStore';
import routeStore from '../stores/routeStore';
import seriesStore from '../stores/seriesStore';
import languageStore from '../stores/languageStore';
import uiStore from '../stores/uiStore';

const SeriesDetailPage = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;
  const selectedSeries = routeStore.currentSeries;

  // Get courses for this series
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
      
      return matchesSeries && matchesInstructor && matchesSearch;
    }) :
    [];

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

  if (!selectedSeries) {
    return null;
  }

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
          <h1 className="text-2xl md:text-3xl font-bold">{selectedSeries.name || selectedSeries.id || 'Series'}</h1>
        </div>
      </div>
      
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
            seriesStore.activeTab === 'about'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => seriesStore.setActiveTab('about')}
        >
          {t('series.aboutThisSeries')}
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            seriesStore.activeTab === 'courses'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => seriesStore.setActiveTab('courses')}
        >
          {t('series.courseList')}
        </button>
      </div>

      {/* Tab Content */}
      {seriesStore.activeTab === 'about' ? (
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
        <CourseList courses={seriesCourses} />
      )}
    </div>
  );
});

export default SeriesDetailPage;