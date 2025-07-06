import React from 'react';
import { observer } from 'mobx-react-lite';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SeriesList from './SeriesList';
import GroupedSeriesList from './GroupedSeriesList';
import SeriesSearchBar from '../../ui/SeriesSearchBar';
import Carousel from '../../ui/Carousel';
import LoadingState from '../../ui/LoadingState';
import ToolsNav from '../../ui/ToolsNav';
import store from '../../../stores/seriesStore';
import routeStore from '../../../stores/routeStore';
import clientStore from '../../../stores/clientStore';
import ListPage from '../../ui/ListPage';
import EditSeriesPage from './EditSeriesPage';
import SeriesCard from './SeriesCard';

const SeriesListPage = observer(() => (
  <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
    {/* {routeStore.isSeriesHomeMode && <Carousel images={clientStore.client.settings.banners} />} */}

    {/* {routeStore.isSeriesHomeMode && <ToolsNav />} */}

    {/* <div className="mb-6">
      <SeriesSearchBar />
    </div> */}

    {/* <LoadingState
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
    </LoadingState> */}

    <div className="bg-white p-4">
      <ListPage
        store={store}
        bannerImages={clientStore.client.settings?.banners}
        editDialogChildren={<EditSeriesPage />}
        renderItem={(series, index, group, { moveItem, isEditMode }, isFirstCard) => (
          <SeriesCard
            key={`${group}-${series.id}-${index}`}
            series={series}
            index={index}
            group={group}
            moveItem={moveItem}
            isEditMode={isEditMode}
            renderDialogs={isFirstCard}
          />
        )}
      />
    </div>
  </div>
));

export default SeriesListPage;