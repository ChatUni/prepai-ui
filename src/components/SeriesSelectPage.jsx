import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { seriesStore } from '../stores/seriesStore';
import languageStore from '../stores/languageStore';
import uiStore from '../stores/uiStore';
import SearchBar from './ui/SearchBar';
import SeriesCard from './ui/SeriesCard';
import LoadingState from './ui/LoadingState';

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

  // Override the SeriesCard's default click behavior for edit mode
  const handleSeriesClick = (e, series) => {
    e.stopPropagation(); // Prevent the SeriesCard's default click behavior
    if (mode === 'edit') {
      seriesStore.setCurrentSeries(series);
      navigate(`/series/${series.id}/edit`);
    } else {
      navigate(`/series/${series.id}/add-course`);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-4 pb-20 md:pb-8 flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'edit' ? t('series.selectToEdit') : t('series.selectTitle')}
      </h1>
      <div className="mb-8 flex-shrink-0">
        <SearchBar />
      </div>
      <div className="flex-1">
        <LoadingState
          isLoading={seriesStore.isLoading}
          isEmpty={!seriesStore.isLoading && seriesStore.series.length === 0}
          customMessage={
            seriesStore.isLoading ? t('common.loading') :
            seriesStore.series.length === 0 ? t('common.no_results') :
            null
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-15">
            {seriesStore.series.map(series => (
              <div key={series.id} onClick={(e) => handleSeriesClick(e, series)}>
                <SeriesCard series={series} />
              </div>
            ))}
          </div>
        </LoadingState>
      </div>
    </div>
  );
});

export default SeriesSelectPage;