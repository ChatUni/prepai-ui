import React from 'react';
import { observer } from 'mobx-react-lite';
import SeriesListPage from './SeriesListPage';
import SeriesDetailPage from './SeriesDetailPage';
import routeStore from '../stores/routeStore';

const SeriesPage = observer(() => {
  return routeStore.seriesId ? <SeriesDetailPage /> : <SeriesListPage />;
});

export default SeriesPage;