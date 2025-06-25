import React from 'react';
import { observer } from 'mobx-react-lite';
import ListPage from '../../ui/ListPage';
import SeriesCard from './SeriesCard';
import languageStore from '../../../stores/languageStore';
import routeStore from '../../../stores/routeStore';
import groupedSeriesStore from '../../../stores/groupedSeriesStore';
import seriesStore from '../../../stores/seriesStore';
import seriesCardStore from '../../../stores/seriesCardStore';

const { t } = languageStore;

const isRecycle = (group) => group === t('series.groups.recycle');
const isEditable = (group) => routeStore.isSeriesSettingMode && !isRecycle(group);

const GenericSeriesListPage = observer(() => {
  // Define shortcut buttons
  const shortcutButtons = [
    {
      key: 'addGroup',
      onClick: groupedSeriesStore.openAddGroupDialog,
      icon: 'FaLayerGroup',
      color: 'green',
      label: t('series.groups.addGroup')
    },
    {
      key: 'addInstructor',
      onClick: () => seriesCardStore.openEditInstructorDialog(),
      icon: 'FaUserPlus',
      color: 'amber',
      shade: 500,
      label: t('series.groups.addInstructor')
    },
    {
      key: 'addSeries',
      onClick: () => groupedSeriesStore.openEditSeriesDialog(),
      icon: 'FaBookOpen',
      color: 'purple',
      shade: 500,
      label: t('series.groups.addSeries')
    }
  ];

  // Render item function for series
  const renderSeriesItem = (series, index, group, { moveItem, isEditMode }, isFirstCard) => (
    <SeriesCard
      key={`${group}-${series.id}-${index}`}
      series={series}
      index={index}
      group={group}
      moveItem={moveItem}
      isEditMode={isEditMode}
      renderDialogs={isFirstCard}
    />
  );

  // Render item function for deleted series (recycle bin)
  const renderDeletedSeriesItem = (series, index, group, { isEditMode }) => (
    <SeriesCard
      key={`${group}-${series.id}-${index}`}
      series={series}
      index={index}
      group={group}
      isEditMode={isEditMode}
    />
  );

  return (
    <ListPage
      // Banner props (can be added later if needed)
      showBanner={false}
      
      // Title props
      title={t('series.title')}
      
      // Search bar props
      searchValue={seriesStore.searchValue || ''}
      onSearchChange={(e) => seriesStore.setSearchValue(e.target.value)}
      searchPlaceholder={t('series.searchPlaceholder')}
      
      // Shortcut buttons
      shortcutButtons={shortcutButtons}
      showShortcutButtons={routeStore.isSeriesSettingMode}
      
      // Main list props
      groupedItems={seriesStore.groupedSeries}
      store={groupedSeriesStore}
      renderItem={renderSeriesItem}
      isEditMode={routeStore.isSeriesSettingMode}
      itemsContainerClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2"
      isGroupEditable={isEditable}
      isGroupDanger={isRecycle}
      onItemMove={groupedSeriesStore.moveSeriesInGroup}
      onGroupDrop={() => seriesStore.saveGroupOrder()}
      editGroupTitle={t('series.groups.editGroup')}
      deleteGroupTitle={t('series.groups.deleteGroup')}
      itemType="series"
      
      // Additional list for recycle bin
      additionalGroupedItems={
        routeStore.isSeriesSettingMode && seriesStore.deletedSeries.length > 0
          ? { [t('series.groups.recycle')]: seriesStore.deletedSeries }
          : {}
      }
      additionalListProps={{
        isGroupEditable: () => false,
        isGroupDanger: () => true,
        renderItem: renderDeletedSeriesItem
      }}
      
      // Dialog props
      editDialogTitle={t('series.edit.editTitle')}
      editDialogChildren={
        // This would be the edit form content for series
        <div>Series edit form would go here</div>
      }
      editDialogSize="lg"
      showDialogs={true}
    />
  );
});

export default GenericSeriesListPage;