import { observer } from 'mobx-react-lite';
import store from '../../../stores/seriesStore';
import clientStore from '../../../stores/clientStore';
import ListPage from '../../ui/ListPage';
import EditSeriesPage from './EditSeriesPage';
import SeriesCard from './SeriesCard';
import PaymentManager from '../../ui/PaymentManager';
import { t } from '../../../stores/languageStore';
import InstructorListPage from '../instructor/InstructorListPage';
import instructorStore from '../../../stores/instructorStore';

const SeriesListPage = observer(() => (
  <>
    {/* {routeStore.isSeriesHomeMode && <ToolsNav />} */}
    <ListPage
      store={store}
      bannerImages={store.isPaidRoute ? [] : clientStore.client.settings?.banners}
      isGrouped={!store.isPaidRoute}
      renderEdit={(step) => <EditSeriesPage step={step} />}
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
      shortcutButtons={[
        {
          label: t('instructor.createNew'),
          icon: 'FiPlus',
          color: 'amber',
          isVisible: x => x.isSettingRoute,
          onClick: () => instructorStore.openAddDialog(),
        },
      ]}
    />
    <PaymentManager />
    {store.isSettingRoute && <InstructorListPage showDialogsOnly={true} />}
  </>
));

export default SeriesListPage;