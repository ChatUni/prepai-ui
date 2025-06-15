import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Button from '../../ui/Button';
import SeriesCard from './SeriesCard';
import EditSeriesPage from './EditSeriesPage';
import EditInstructorPage from '../instructor/EditInstructorPage';
import GroupedList from '../../ui/GroupedList';
import { DeleteConfirmDialog, VisibilityConfirmDialog, EditDialog, GroupNameDialog, ErrorDialog } from '../../ui/CrudDialogs';
import languageStore from '../../../stores/languageStore';
import routeStore from '../../../stores/routeStore';
import groupedSeriesStore from '../../../stores/groupedSeriesStore';
import seriesStore from '../../../stores/seriesStore';
import seriesCardStore from '../../../stores/seriesCardStore';
import editSeriesStore from '../../../stores/editSeriesStore';
import editInstructorStore from '../../../stores/editInstructorStore';

const { t } = languageStore;

const isRecycle = (group) => group === t('series.groups.recycle');
const isEditable = (group) => routeStore.isSeriesSettingMode && !isRecycle(group);

const GroupedSeriesList = observer(() => {
  const navigate = useNavigate();

  return (
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
        renderItem={(series, index, group, { moveItem, isEditMode }) => (
          <SeriesCard
            key={`${group}-${series.id}-${index}`}
            series={series}
            index={index}
            group={group}
            moveItem={moveItem}
            isEditMode={isEditMode}
            onClick={(series) => seriesCardStore.handleSeriesClick(series.id, navigate)}
            onToggleVisibility={seriesCardStore.handleToggleVisibility}
            onEdit={seriesCardStore.handleEdit}
            onDelete={seriesCardStore.handleDelete}
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
              onEdit={seriesCardStore.handleEdit}
              onDelete={seriesCardStore.handleRestore}
            />
          )}
        />
      )}

      {/* Group Management Dialogs */}
      <GroupNameDialog
        isOpen={groupedSeriesStore.isAddGroupDialogOpen}
        onClose={groupedSeriesStore.closeAddGroupDialog}
        onConfirm={groupedSeriesStore.addGroup}
        title={t('series.groups.newGroup')}
        value={groupedSeriesStore.newGroupName}
        onChange={groupedSeriesStore.setNewGroupName}
        placeholder={t('series.groups.enterName')}
      />

      <GroupNameDialog
        isOpen={groupedSeriesStore.isEditGroupDialogOpen}
        onClose={groupedSeriesStore.closeEditGroupDialog}
        onConfirm={groupedSeriesStore.editGroup}
        title={t('series.groups.editGroup')}
        value={groupedSeriesStore.newGroupName}
        onChange={groupedSeriesStore.setNewGroupName}
        placeholder={t('series.groups.enterName')}
      />

      <DeleteConfirmDialog
        isOpen={groupedSeriesStore.isDeleteGroupDialogOpen}
        onClose={groupedSeriesStore.closeDeleteGroupDialog}
        onConfirm={groupedSeriesStore.deleteGroup}
        item={{ name: groupedSeriesStore.groupToDelete }}
        itemType="series.groups"
      />

      <ErrorDialog
        isOpen={groupedSeriesStore.isErrorDialogOpen}
        onClose={groupedSeriesStore.closeErrorDialog}
        message={groupedSeriesStore.errorMessage}
      />

      {/* Series CRUD Dialogs */}
      <DeleteConfirmDialog
        isOpen={seriesCardStore.showDeleteDialog}
        onClose={seriesCardStore.closeDeleteDialog}
        onConfirm={seriesCardStore.confirmDelete}
        item={seriesCardStore.currentSeries}
        itemType="series"
      />

      <VisibilityConfirmDialog
        isOpen={seriesCardStore.showVisibilityDialog}
        onClose={seriesCardStore.closeVisibilityDialog}
        onConfirm={seriesCardStore.confirmVisibilityChange}
        item={seriesCardStore.currentSeries}
        itemType="series"
      />

      {/* Edit Series Dialog */}
      {(groupedSeriesStore.isEditSeriesDialogOpen || editSeriesStore.series) && (
        <EditSeriesPage
          onClose={groupedSeriesStore.closeEditSeriesDialog}
        />
      )}

      {/* Edit Instructor Dialog */}
      <EditDialog
        isOpen={seriesCardStore.editInstructorDialogOpen}
        onClose={seriesCardStore.closeEditInstructorDialog}
        onConfirm={async () => {
          const success = await editInstructorStore.saveInstructor();
          if (success) {
            await seriesStore.fetchSeries();
            seriesCardStore.closeEditInstructorDialog();
          }
        }}
        title={editInstructorStore.editingInstructor ? t('instructors.edit.title') : t('instructors.add.title')}
        size="xl"
      >
        <EditInstructorPage />
      </EditDialog>
    </div>
  );
});

export default GroupedSeriesList;