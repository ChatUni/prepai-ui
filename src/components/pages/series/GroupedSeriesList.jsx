import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Button from '../../ui/Button';
import SeriesCard from './SeriesCard';
import GroupedList from '../../ui/GroupedList';
import languageStore from '../../../stores/languageStore';
import routeStore from '../../../stores/routeStore';
import groupedSeriesStore from '../../../stores/groupedSeriesStore';
import seriesStore from '../../../stores/seriesStore';
import seriesCardStore from '../../../stores/seriesCardStore';

const { t } = languageStore;

const isRecycle = (group) => group === t('series.groups.recycle');
const isEditable = (group) => routeStore.isSeriesSettingMode && !isRecycle(group);

const GroupedSeriesList = observer(() => (
  <div className="w-full space-y-4">
    {routeStore.isSeriesSettingMode && (
      <div className="grid grid-cols-3 gap-4 mt-8">
        <Button
          onClick={groupedSeriesStore.openAddGroupDialog}
          icon="FaLayerGroup"
          color="green"
        >
          {t('series.groups.addGroup')}
        </Button>
        <Button
          onClick={() => seriesCardStore.openEditInstructorDialog()}
          icon="FaUserPlus"
          color="amber"
          shade={500}
        >
          {t('series.groups.addInstructor')}
        </Button>
        <Button
          onClick={() => groupedSeriesStore.openEditSeriesDialog()}
          icon="FaBookOpen"
          color="purple"
          shade={500}
        >
          {t('series.groups.addSeries')}
        </Button>
      </div>
    )}

    <GroupedList
      groupedItems={seriesStore.groupedSeries}
      store={groupedSeriesStore}
      isEditMode={routeStore.isSeriesSettingMode}
      itemsContainerClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2"
      isGroupEditable={isEditable}
      isGroupDanger={isRecycle}
      onItemMove={groupedSeriesStore.moveSeriesInGroup}
      onGroupDrop={() => seriesStore.saveGroupOrder()}
      onEditGroup={groupedSeriesStore.openEditGroupDialog}
      onDeleteGroup={groupedSeriesStore.handleDeleteGroup}
      editGroupTitle={t('series.groups.editGroup')}
      deleteGroupTitle={t('series.groups.deleteGroup')}
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

    {routeStore.isSeriesSettingMode && seriesStore.deletedSeries.length > 0 && (
      <GroupedList
        groupedItems={{ [t('series.groups.recycle')]: seriesStore.deletedSeries }}
        store={groupedSeriesStore}
        isEditMode={routeStore.isSeriesSettingMode}
        itemsContainerClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2"
        isGroupEditable={() => false}
        isGroupDanger={() => true}
        renderItem={(series, index, group, { isEditMode }) => (
          <SeriesCard
            key={`${group}-${series.id}-${index}`}
            series={series}
            index={index}
            group={group}
            isEditMode={isEditMode}
          />
        )}
      />
    )}

  </div>
));

export default GroupedSeriesList;