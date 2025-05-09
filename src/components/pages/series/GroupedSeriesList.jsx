import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import SeriesCard from './SeriesCard';
import EditSeriesPage from './EditSeriesPage';
import { AccordionSection } from '../../ui/AdminAccordion';
import Dialog from '../../ui/Dialog';
import languageStore from '../../../stores/languageStore';
import routeStore from '../../../stores/routeStore';
import groupedSeriesStore from '../../../stores/groupedSeriesStore';
import seriesStore from '../../../stores/seriesStore';

const GroupedSeriesList = observer(() => {
  const { t } = languageStore;

  const renderGroupActions = (group) => {
    if (!routeStore.isSeriesSettingMode) return null;

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            groupedSeriesStore.openAddSeriesDialog(group);
          }}
          className="p-1 text-white/70 hover:text-white transition-colors"
          title={t('series.groups.addSeries')}
        >
          <FiPlus size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            groupedSeriesStore.openEditGroupDialog(group);
          }}
          className="p-1 text-white/70 hover:text-white transition-colors"
          title={t('series.groups.editGroup')}
        >
          <FiEdit2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (groupedSeriesStore.canDeleteGroup(group)) {
              groupedSeriesStore.openDeleteGroupDialog(group);
            } else {
              groupedSeriesStore.showErrorDialog(t('series.groups.cannotDelete'));
            }
          }}
          className="p-1 text-white/70 hover:text-white transition-colors"
          title={t('series.groups.deleteGroup')}
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
        {groupedSeriesStore.groupEntries.map(([group, series], index) => (
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
      {routeStore.isSeriesSettingMode && (
        <div className="flex justify-center mt-8">
          <button
            onClick={groupedSeriesStore.openAddGroupDialog}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiPlus size={20} />
            {t('series.groups.addGroup')}
          </button>
        </div>
      )}
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
      <Dialog
        isOpen={groupedSeriesStore.isAddSeriesDialogOpen}
        onClose={groupedSeriesStore.closeAddSeriesDialog}
        onConfirm={async () => {
          const form = document.querySelector('.edit-series-form');
          if (form) {
            const success = await seriesStore.handleSubmit(form);
            if (success) {
              // Refresh data after successful save
              await seriesStore.fetchSeries();
              groupedSeriesStore.closeAddSeriesDialog();
            }
          }
        }}
        title={seriesStore.currentSeriesId ? t('series.edit.editTitle') : t('series.groups.addSeries')}
        size="xl"
        isConfirm={true}
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <EditSeriesPage />
        </div>
      </Dialog>
    </div>
  );
});

export default GroupedSeriesList;