import React from 'react';
import { observer } from 'mobx-react-lite';
import CourseList from '../../ui/CourseList';
import seriesStore from '../../../stores/seriesStore';
import languageStore from '../../../stores/languageStore';
import TabPanel from '../../ui/TabPanel';

const SeriesDetailPage = observer(() => {
  const { t } = languageStore;
  const selectedSeries = seriesStore.currentSeriesFromRoute;
  const seriesCourses = seriesStore.filteredSeriesCourses;

  if (!selectedSeries) {
    return null;
  }

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      <div className="flex items-center mb-3">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold">{selectedSeries.name || selectedSeries.id || t('series.defaultTitle')}</h1>
        </div>
      </div>
      
      {/* Series cover image */}
      <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
        {typeof selectedSeries.cover === 'string' ? (
          <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
            <img
              src={selectedSeries.cover}
              alt={selectedSeries.name || t('series.coverImageAlt')}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="relative pb-[56.25%] bg-gray-200 dark:bg-gray-700"> {/* 16:9 aspect ratio */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">{t('series.noCover')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Panel */}
      <TabPanel className="mb-6 border border-gray-200">
        <TabPanel.Tab label={t('series.aboutThisSeries')}>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {typeof selectedSeries.desc === 'string' ? selectedSeries.desc : t('series.noDescription')}
            </p>
          </div>
        </TabPanel.Tab>
        
        <TabPanel.Tab label={t('series.courseList')}>
          <CourseList courses={seriesCourses} />
        </TabPanel.Tab>
      </TabPanel>
    </div>
  );
});

export default SeriesDetailPage;