import React from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import SeriesList from './SeriesList';
import SearchBar from '../../ui/SearchBar';
import Carousel from '../../ui/Carousel';
import LoadingState from '../../ui/LoadingState';
import ToolsNav from '../../ui/ToolsNav';
import coursesStore from '../../../stores/coursesStore';
import { tap } from '../../../../netlify/functions/utils';

const SeriesListPage = observer(() => {
  const { seriesId: mode } = useParams();
  const isSelectMode = mode === 'select';
  const isExamMode = mode === 'exam';

  // Load series data if not already loaded
  React.useEffect(() => {
    if (coursesStore.series.length === 0) {
      coursesStore.fetchSeries();
    }
  }, []);

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {/* Carousel - only show in non-select and non-exam mode */}
      {!isSelectMode && !isExamMode && <Carousel images={coursesStore.seriesCovers} />}

      {/* Tools Navigation - only show in non-select and non-exam mode */}
      {!isSelectMode && !isExamMode && <ToolsNav />}

      {/* Search bar */}
      <div className="mb-6">
        <SearchBar />
      </div>

      {/* Series List */}
      <LoadingState
        isLoading={coursesStore.isLoading}
        isError={!Array.isArray(coursesStore.filteredSeries)}
        isEmpty={Array.isArray(coursesStore.filteredSeries) && coursesStore.filteredSeries.length === 0}
      >
        <SeriesList
          title=""
          series={coursesStore.filteredSeries}
          isAllInstructors={true}
          mode={mode}
        />
      </LoadingState>
    </div>
  );
});

export default SeriesListPage;