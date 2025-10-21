import React from 'react';
import { observer } from 'mobx-react-lite';
import CourseListPage from './CourseListPage';
import seriesStore from '../../../stores/seriesStore';
import { t } from '../../../stores/languageStore';
import TabPanel from '../../ui/TabPanel';
import PaymentManager from '../../ui/PaymentManager';
import { useParams, useSearchParams } from 'react-router-dom';
import { StickyButton } from '../../ui/Button';
import paymentManagerStore from '../../../stores/paymentManagerStore';

const SeriesDetailPage = observer(() => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const selectedSeries = seriesStore.items.find(x => x.id == id);
  if (!selectedSeries) return null;
  const instructors = seriesStore.getSeriesInstructors(selectedSeries);
  const isPaid = seriesStore.isPaid(selectedSeries.id);
  
  // Get initial tab from URL parameter, default to 0 (About This Series)
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'courses' ? 2 : 0; // 2 is the index for Course List tab

  return (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      <div className="flex items-center mb-3">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold">{selectedSeries.name || selectedSeries.id || t('series.defaultTitle')}</h1>
        </div>
      </div>
      
      {/* Series cover image */}
      <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
        {typeof selectedSeries.image === 'string' ? (
          <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
            <img
              src={selectedSeries.image}
              alt={selectedSeries.name || t('series.imageAlt')}
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
      <TabPanel className="mb-6 border border-gray-200" initialActiveTab={initialTab}>
        <TabPanel.Tab label={t('series.aboutThisSeries')}>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            {selectedSeries.category && (
              <div className="mb-4">
                <span className="font-medium text-gray-600 dark:text-gray-400">{t('series.category')}: </span>
                <span className="text-gray-700 dark:text-gray-300">{selectedSeries.category}</span>
              </div>
            )}
            {selectedSeries.desc ? (
              selectedSeries.desc.startsWith('http') ? (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedSeries.desc}
                    alt={t('series.descriptionImage')}
                    className="w-full"
                  />
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {selectedSeries.desc}
                </p>
              )
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {t('series.noDescription')}
              </p>
            )}
          </div>
        </TabPanel.Tab>
        
        <TabPanel.Tab label={t('series.instructorList')}>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            {instructors.length > 0 ? (
              <div className="space-y-4">
                {instructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-start space-x-4">
                    {instructor.image ? (
                      <img
                        src={instructor.image}
                        alt={instructor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">{t('series.noAvatar')}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{instructor.name}</h3>
                      {instructor.title && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{instructor.title}</p>
                      )}
                      {instructor.bio && (
                        <p className="mt-2 text-gray-700 dark:text-gray-300">{instructor.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{t('series.noInstructors')}</p>
            )}
          </div>
        </TabPanel.Tab>

        <TabPanel.Tab label={t('series.courseList')}>
          <CourseListPage series={selectedSeries} />
        </TabPanel.Tab>
      </TabPanel>

      {!isPaid && (
        <StickyButton
          onClick={() => paymentManagerStore.setShowSeriesDialog(true, selectedSeries)}
          color="green"
        >
          {t('series.purchase')}
        </StickyButton>
      )}

      <PaymentManager />
    </div>
  );
});

export default SeriesDetailPage;