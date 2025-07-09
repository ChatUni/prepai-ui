import { observer } from 'mobx-react-lite';
import store from '../../../stores/seriesStore';
import clientStore from '../../../stores/clientStore';
import ListPage from '../../ui/ListPage';
import EditSeriesPage from './EditSeriesPage';
import SeriesCard from './SeriesCard';
import PaymentManager from '../../ui/PaymentManager';
import { t } from '../../../stores/languageStore';
import { useEffect } from 'react';

const SeriesListPage = observer(({ showPaidOnly }) => {
  useEffect(() => {
    store.showPaidOnly = showPaidOnly;
  }, [showPaidOnly]);

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      {/* {routeStore.isSeriesHomeMode && <ToolsNav />} */}

      <div className="bg-white p-4">
        <ListPage
          store={store}
          bannerImages={showPaidOnly ? [] : clientStore.client.settings?.banners}
          isGrouped={!showPaidOnly}
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
          filters={[
            {
              selectedField: 'selectedCategory',
              optionsField: 'uniqueCategories',
              allLabel: t('series.search.allCategories'),
            },
            {
              selectedField: 'selectedInstructorId',
              optionsField: 'allInstructors',
              allLabel: t('series.search.allInstructors'),
            },
          ]}
        />
      </div>
      <PaymentManager />
    </div>
  );
});

export default SeriesListPage;