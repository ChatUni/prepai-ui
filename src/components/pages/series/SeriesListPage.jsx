import React from 'react';
import { observer } from 'mobx-react-lite';
import SeriesList from './SeriesList';
import SearchBar from '../../ui/SearchBar';
import Carousel from '../../ui/Carousel';
import LoadingState from '../../ui/LoadingState';
import ToolsNav from '../../ui/ToolsNav';
import coursesStore from '../../../stores/coursesStore';
import routeStore from '../../../stores/routeStore';
import { tap } from '../../../../netlify/functions/utils';

const SeriesListPage = observer(() => {
  React.useEffect(() => {
    if (coursesStore.series.length === 0) {
      coursesStore.fetchSeries();
    }
  }, []);

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {routeStore.isSeriesListMode && <Carousel images={coursesStore.seriesCovers} />}

      {routeStore.isSeriesListMode && <ToolsNav />}

      <div className="mb-6">
        <SearchBar />
      </div>

      <LoadingState
        isLoading={coursesStore.isLoading}
        isError={!Array.isArray(coursesStore.filteredSeries)}
        isEmpty={Array.isArray(coursesStore.filteredSeries) && coursesStore.filteredSeries.length === 0}
      >
        <SeriesList
          title=""
          series={coursesStore.filteredSeries}
          isAllInstructors={true}
        />
      </LoadingState>
    </div>
  );
});

export default SeriesListPage;