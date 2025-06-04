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
import seriesStore from '../../../stores/seriesStore';
import routeStore from '../../../stores/routeStore';
import clientStore from '../../../stores/clientStore';

const SeriesListPage = observer(() => (
  <DndProvider backend={HTML5Backend}>
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      {routeStore.isSeriesHomeMode && <Carousel images={clientStore.client.settings.banners} />}

      {routeStore.isSeriesHomeMode && <ToolsNav />}

      <div className="mb-6">
        <SearchBar />
      </div>

      <LoadingState
        isLoading={seriesStore.isLoading}
        isError={!seriesStore.isSeriesValid}
        isEmpty={seriesStore.filteredSeries.length === 0}
      >
        {routeStore.isSeriesGroupMode ? (
          <GroupedSeriesList />
        ) : (
          <SeriesList
            title=""
            series={routeStore.isMySeriesMode ? seriesStore.mySeries : seriesStore.filteredSeries}
            isAllInstructors={true}
          />
        )}
      </LoadingState>
    </div>
  </DndProvider>
));

export default SeriesListPage;