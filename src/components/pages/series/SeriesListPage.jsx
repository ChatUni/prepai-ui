import React from 'react';
import { observer } from 'mobx-react-lite';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SeriesList from './SeriesList';
import GroupedSeriesList from './GroupedSeriesList';
import SearchBar from '../../ui/SearchBar';
import Carousel from '../../ui/Carousel';
import LoadingState from '../../ui/LoadingState';
import ToolsNav from '../../ui/ToolsNav';
import coursesStore from '../../../stores/coursesStore';
import routeStore from '../../../stores/routeStore';
import clientStore from '../../../stores/clientStore';
import userStore from '../../../stores/userStore';

const SeriesListPage = observer(() => {
  React.useEffect(() => {
    if (coursesStore.series.length === 0) {
      coursesStore.fetchSeries();
    }
    if (!clientStore.client.settings.banners.length) {
      clientStore.loadClient();
    }
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {routeStore.isSeriesHomeMode && <Carousel images={clientStore.client.settings.banners} />}

      {routeStore.isSeriesHomeMode && <ToolsNav />}

      <div className="mb-6">
        <SearchBar />
      </div>

      <LoadingState
        isLoading={coursesStore.isLoading}
        isError={!Array.isArray(coursesStore.filteredSeries)}
        isEmpty={Array.isArray(coursesStore.filteredSeries) && coursesStore.filteredSeries.length === 0}
      >
        {routeStore.isSeriesGroupMode ? (
          <GroupedSeriesList />
        ) : (
          <SeriesList
            title=""
            series={coursesStore.filteredSeries}
            isAllInstructors={true}
          />
        )}
      </LoadingState>
      </div>
    </DndProvider>
  );
});

export default SeriesListPage;