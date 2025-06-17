import React from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import BaseCard from '../../ui/BaseCard';
import Dialog from '../../ui/Dialog';
import EditSeriesPage from './EditSeriesPage';
import EditInstructorPage from '../instructor/EditInstructorPage';
import { EditDialog } from '../../ui/CrudDialogs';
import routeStore from '../../../stores/routeStore';
import languageStore from '../../../stores/languageStore';
import seriesCardStore from '../../../stores/seriesCardStore';
import seriesStore from '../../../stores/seriesStore';
import groupedSeriesStore from '../../../stores/groupedSeriesStore';
import editInstructorStore from '../../../stores/editInstructorStore';
import editSeriesStore from '../../../stores/editSeriesStore';
import userStore from '../../../stores/userStore';

const SeriesCard = observer(({
  series,
  index,
  moveItem,
  group,
  isEditMode = false,
  renderDialogs = false,
  onClick
}) => {
  const { t } = languageStore;
  const navigate = useNavigate();
  const validatedSeries = seriesCardStore.validateSeries(series);
  if (!validatedSeries) return null;

  const { id: seriesId, name, desc, cover, price } = validatedSeries;
  const image = seriesCardStore.getImage(cover);
  const instructors = seriesStore.getSeriesInstructors(series);
  const courses = series.courses || [];

  const handleCardClick = useCallback((series) => {
    if (onClick) {
      onClick(series);
    } else if (!isEditMode) {
      seriesCardStore.handleSeriesClick(seriesId, navigate);
    }
  }, [onClick, isEditMode, seriesId, navigate]);

  const handleInstructorClick = useCallback((e, instructor) => {
    e.stopPropagation();
    if (isEditMode) {
      seriesCardStore.openEditInstructorDialog(instructor);
    }
  }, [isEditMode]);

  return (
    <>
      <BaseCard
        item={series}
        index={index}
        group={group}
        moveItem={moveItem}
        isEditMode={isEditMode}
        onClick={handleCardClick}
        onToggleVisibility={seriesCardStore.handleToggleVisibility}
        onEdit={seriesCardStore.handleEdit}
        onDelete={seriesCardStore.handleDelete}
        onDrop={seriesStore.saveSeriesUpdates}
        className="relative"
        store={seriesCardStore}
        itemType="series"
        editDialogTitle=""
        editDialogChildren={null}
        renderDialogs={renderDialogs}
      >
        <div className="relative pb-[56.25%]">
          <img
            src={image}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <h3 className="text-white font-bold truncate">{name}</h3>
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <div className="flex flex-wrap gap-2">
              {instructors.map((instructor, index) => (
                <div
                  key={instructor.id}
                  className={`flex items-center ${isEditMode ? 'cursor-pointer hover:opacity-80' : ''}`}
                  onClick={(e) => handleInstructorClick(e, instructor)}
                >
                  <div className="relative">
                    {instructor?.image ? (
                      <img
                        src={instructor.image}
                        alt={instructor.name}
                        className="w-6 h-6 rounded-full mr-1"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 mr-1 flex items-center justify-center">
                        <span className="text-xs text-gray-600">{instructor?.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                    )}
                    {isEditMode && (
                      <div className="absolute -top-1 -right-0 p-1 rounded-full bg-blue-800/80">
                        <FiEdit2 size={6} className="text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {instructor?.name}
                    {index < instructors.length - 1 && ", "}
                  </span>
                </div>
              ))}
            </div>
            {price > 0 && (
              !userStore.isAdmin && userStore.isPaid('series', seriesId) ? (
                <span className="text-green-600 dark:text-green-400 font-bold">{t('series.paid')}</span>
              ) : (
                <span className="text-red-600 dark:text-red-300 font-bold">${price}</span>
              )
            )}
          </div>
          
          {desc && !desc.startsWith('http') && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {desc}
            </p>
          )}
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('series.courseCount', { count: courses.length})}</p>
            </div>
          </div>
        </div>
      </BaseCard>
      
      {/* Render dialogs only for the first card */}
      {renderDialogs && (
        <>
          {/* Restore dialog for deleted series */}
          {series.deleted && (
            <Dialog
              isOpen={seriesCardStore.showRestoreDialog && seriesCardStore.currentSeries?.id === seriesId}
              onClose={seriesCardStore.closeRestoreDialog}
              onConfirm={seriesCardStore.confirmRestore}
              title={t('series.edit.restore')}
              isConfirm={true}
            >
              <p>{t('series.confirmRestore', { name: series.name })}</p>
            </Dialog>
          )}

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
        </>
      )}
    </>
  );
});

export default SeriesCard;