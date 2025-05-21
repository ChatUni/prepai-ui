import React from 'react';
import { observer } from 'mobx-react-lite';
import ActionButton from '../../ui/ActionButton';
import Button from '../../ui/Button';
import SeriesCard from './SeriesCard';
import EditSeriesPage from './EditSeriesPage';
import EditInstructorPage from '../instructor/EditInstructorPage';
import { AccordionSection } from '../../ui/AdminAccordion';
import Dialog from '../../ui/Dialog';
import languageStore from '../../../stores/languageStore';
import routeStore from '../../../stores/routeStore';
import groupedSeriesStore from '../../../stores/groupedSeriesStore';
import seriesStore from '../../../stores/seriesStore';
import seriesCardStore from '../../../stores/seriesCardStore';
import editSeriesStore from '../../../stores/editSeriesStore';
import editInstructorStore from '../../../stores/editInstructorStore';

const GroupedSeriesList = observer(() => {
  const { t } = languageStore;

  const renderGroupActions = (group) => {
    if (!routeStore.isSeriesSettingMode) return null;

    return (
      <div className="flex items-center gap-2">
        <ActionButton
          onClick={() => groupedSeriesStore.openEditGroupDialog(group)}
          icon="FiEdit2"
          color="white"
          title={t('series.groups.editGroup')}
        />
        <ActionButton
          onClick={() => groupedSeriesStore.handleDeleteGroup(group)}
          icon="FiTrash2"
          color="white"
          title={t('series.groups.deleteGroup')}
        />
      </div>
    );
  };

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
            onClick={() => {
              editInstructorStore.reset();
              seriesCardStore.openEditInstructorDialog();
            }}
            icon="FaUserPlus"
            color="amber"
            shade={500}
          >
            {t('series.groups.addInstructor')}
          </Button>
          <Button
            onClick={() => {
              editSeriesStore.reset();
              groupedSeriesStore.openAddSeriesDialog();
            }}
            icon="FaBookOpen"
            color="purple"
            shade={500}
          >
            {t('series.groups.addSeries')}
          </Button>
        </div>
      )}

      {Object.entries(seriesStore.groupedSeries).map(([group, series], index) => (
        <AccordionSection
          key={group}
          title={`${group} (${series.length})`}
          actions={renderGroupActions(group)}
          isExpanded={groupedSeriesStore.isGroupExpanded(group)}
          onToggle={() => groupedSeriesStore.toggleGroup(group)}
          maxHeight="96"
          index={index}
          moveGroup={groupedSeriesStore.moveGroup}
          isDraggable={routeStore.isSeriesSettingMode}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2">
            {series.map((seriesItem, index) => (
              <SeriesCard
                key={`${group}-${seriesItem.id}-${index}`}
                series={seriesItem}
                index={index}
                moveItem={(fromIndex, toIndex) =>
                  routeStore.isSeriesSettingMode &&
                  groupedSeriesStore.moveSeriesInGroup(group, fromIndex, toIndex)
                }
              />
            ))}
          </div>
        </AccordionSection>
      ))}

      <Dialog
        isOpen={groupedSeriesStore.isAddGroupDialogOpen}
        onClose={groupedSeriesStore.closeAddGroupDialog}
        onConfirm={groupedSeriesStore.addGroup}
        title={t('series.groups.newGroup')}
        isConfirm={true}
      >
        <input
          type="text"
          value={groupedSeriesStore.newGroupName}
          onChange={(e) => groupedSeriesStore.setNewGroupName(e.target.value)}
          placeholder={t('series.groups.enterName')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </Dialog>

      <Dialog
        isOpen={groupedSeriesStore.isEditGroupDialogOpen}
        onClose={groupedSeriesStore.closeEditGroupDialog}
        onConfirm={groupedSeriesStore.editGroup}
        title={t('series.groups.editGroup')}
        isConfirm={true}
      >
        <input
          type="text"
          value={groupedSeriesStore.newGroupName}
          onChange={(e) => groupedSeriesStore.setNewGroupName(e.target.value)}
          placeholder={t('series.groups.enterName')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </Dialog>

      <Dialog
        isOpen={groupedSeriesStore.isDeleteGroupDialogOpen}
        onClose={groupedSeriesStore.closeDeleteGroupDialog}
        onConfirm={groupedSeriesStore.deleteGroup}
        title={t('series.groups.deleteGroup')}
        isConfirm={true}
      >
        <p className="text-gray-700">{t('series.groups.confirmDelete')}</p>
      </Dialog>

      <Dialog
        isOpen={groupedSeriesStore.isErrorDialogOpen}
        onClose={groupedSeriesStore.closeErrorDialog}
        title={t('common.error')}
      >
        <p className="text-gray-700">{groupedSeriesStore.errorMessage}</p>
      </Dialog>

      {(groupedSeriesStore.isAddSeriesDialogOpen || editSeriesStore.series) && (
        <EditSeriesPage
          onClose={() => {
            groupedSeriesStore.closeAddSeriesDialog();
            editSeriesStore.reset(null);
          }}
          onSave={async () => {
            const success = await editSeriesStore.saveSeries();
            if (success) {
              await seriesStore.fetchSeries();
              groupedSeriesStore.closeAddSeriesDialog();
              editSeriesStore.reset(null);
            }
          }}
        />
      )}

      <Dialog
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
        isConfirm={true}
      >
        <EditInstructorPage />
      </Dialog>
    </div>
  );
});

export default GroupedSeriesList;