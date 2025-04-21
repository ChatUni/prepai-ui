import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { seriesStore } from '../stores/seriesStore';
import languageStore from '../stores/languageStore';
import uiStore from '../stores/uiStore';
import SearchBar from './ui/SearchBar';

const SeriesSelectPage = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = languageStore;

  // Get mode and seriesId from URL params
  const mode = searchParams.get('mode') || 'add';
  const editSeriesId = searchParams.get('seriesId');

  useEffect(() => {
    if (seriesStore.series.length === 0) {
      seriesStore.fetchSeries();
    }
  }, []);

  const handleSeriesClick = (series) => {
    if (mode === 'edit') {
      // If we're in edit mode, set current series and navigate to edit page
      seriesStore.setCurrentSeries(series);
      navigate(`/series/${series.id}/edit`);
    } else {
      // Otherwise, navigate to add course page
      navigate(`/series/${series.id}/add-course`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'edit' ? t('series.selectToEdit') : t('series.selectTitle')}
      </h1>
      <div className="mb-8 flex-shrink-0">
        <SearchBar />
      </div>
      <div className="bg-white rounded-lg shadow flex-1 overflow-hidden">
        <div className="divide-y divide-gray-200 overflow-y-auto h-full">
          {seriesStore.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">{t('common.loading')}</div>
            </div>
          ) : seriesStore.series.map(series => (
            <div
              key={series.id}
              onClick={() => handleSeriesClick(series)}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{series.name}</h3>
                  <p className="text-sm text-gray-500">
                    {t('menu.instructor_label')}: {series.instructor?.name || t('menu.categories.unknownInstructor')}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {!seriesStore.isLoading && seriesStore.series.length === 0 && (
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