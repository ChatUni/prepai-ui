import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import SeriesList from './ui/SeriesList';
import SearchBar from './ui/SearchBar';
import Carousel from './ui/Carousel';
import coursesStore from '../stores/coursesStore';
import languageStore from '../stores/languageStore';

const SeriesListPage = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;

  // Start carousel rotation
  React.useEffect(() => {
    if (coursesStore.series.length > 0) {
      carouselStore.startRotation();
    }
    return () => carouselStore.cleanup();
  }, [coursesStore.series.length]);

  // Load series data if not already loaded
  React.useEffect(() => {
    if (coursesStore.series.length === 0) {
      coursesStore.fetchSeries();
    }
  }, []);

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {/* Carousel */}
      <Carousel />

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

      {/* Search bar */}
      <div className="mb-6">
        <SearchBar />
      </div>

      {/* Series List */}
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

export default SeriesListPage;