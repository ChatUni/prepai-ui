import React from 'react';
import { observer } from 'mobx-react-lite';
import SeriesList from './ui/SeriesList';
import SearchBar from './ui/SearchBar';
import Carousel from './ui/Carousel';
import LoadingState from './ui/LoadingState';
import ToolsNav from './ui/ToolsNav';
import coursesStore from '../stores/coursesStore';

const SeriesListPage = observer(() => {
  // Load series data if not already loaded
  React.useEffect(() => {
    if (coursesStore.series.length === 0) {
      coursesStore.fetchSeries();
    }
  }, []);

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {/* Carousel */}
      <Carousel images={coursesStore.seriesCovers} />

      {/* Tools Navigation */}
      <ToolsNav />

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
        <SeriesList title="" series={coursesStore.filteredSeries} isAllInstructors={true} />
      </LoadingState>
    </div>
  );
});

export default SeriesListPage;