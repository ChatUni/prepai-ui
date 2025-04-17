import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import coursesStore from '../stores/coursesStore';
import languageStore from '../stores/languageStore';
import uiStore from '../stores/uiStore';
import SearchBar from './ui/SearchBar';

const SeriesSelectPage = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;

  useEffect(() => {
    if (coursesStore.series.length === 0) {
      coursesStore.fetchSeries();
    }
    if (coursesStore.courses.length === 0) {
      coursesStore.fetchCourses();
    }
  }, []);

  const handleSeriesClick = (seriesId) => {
    navigate(`/series/${seriesId}/add-course`);
  };

  const courseCount = (seriesId) => {
    return coursesStore.coursesBySeries[seriesId]?.length || 0;
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">{t('series.selectTitle')}</h1>
      <div className="mb-8 flex-shrink-0">
        <SearchBar />
      </div>
      <div className="bg-white rounded-lg shadow flex-1 overflow-hidden">
        <div className="divide-y divide-gray-200 overflow-y-auto h-full">
          {coursesStore.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">{t('common.loading')}</div>
            </div>
          ) : coursesStore.filteredSeries.map(series => (
            <div
              key={series.id}
              onClick={() => handleSeriesClick(series.id)}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{series.name}</h3>
                  <p className="text-sm text-gray-500">
                    {t('menu.instructor_label')}: {series.instructor?.name || t('menu.categories.unknownInstructor')}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {courseCount(series.id)} {t('menu.categories.courses')}
                </div>
              </div>
            </div>
          ))}
          {!coursesStore.isLoading && coursesStore.filteredSeries.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">{t('common.no_results')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SeriesSelectPage;