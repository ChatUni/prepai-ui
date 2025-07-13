import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { FiEdit2 } from 'react-icons/fi';
import CardEditActions from '../../ui/CardEditActions';
import { t } from '../../../stores/languageStore';
import store from '../../../stores/seriesStore';
import userStore from '../../../stores/userStore';
import DndOrderContainer from '../../ui/DndOrderContainer';

const SeriesCard = observer(({
  series,
  index,
  moveItem,
  group,
  isEditMode = false,
  renderDialogs = false,
  onClick
}) => {
  const navigate = useNavigate();
  // const validatedSeries = seriesCardStore.validateSeries(series);
  // if (!validatedSeries) return null;

  const { id: seriesId, name, desc, image, price } = series; // validatedSeries;
  // const image = seriesCardStore.getImage(cover);
  const instructors = store.getSeriesInstructors(series);
  const courses = series.courses || [];

  // Drag and drop functionality
  // const { isDragging, isOver, handleRef } = useDragAndDrop({
  //   type: `item-${group}`,
  //   index,
  //   moveItem,
  //   onDrop: seriesStore.saveSeriesUpdates
  // });

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on action buttons
    if (isEditMode && e.target.closest('.action-button')) {
      return;
    }
    store.gotoDetail(series, navigate);
  };

  // const handleCardClick = useCallback((e) => {
  //   // Don't trigger card click if clicking on action buttons
  //   if (isEditMode && e.target.closest('.action-button')) {
  //     return;
  //   }
  //   if (onClick) {
  //     onClick(series);
  //   } else if (!isEditMode) {
  //     seriesCardStore.handleSeriesClick(seriesId, navigate);
  //   }
  // }, [onClick, isEditMode, seriesId, navigate, series]);

  // const handleInstructorClick = useCallback((e, instructor) => {
  //   e.stopPropagation();
  //   if (isEditMode) {
  //     seriesCardStore.openEditInstructorDialog(instructor);
  //   }
  // }, [isEditMode]);

  return (
    <>
    <DndOrderContainer
      isEditMode={isEditMode}
      type={`item-${group}`}
      index={index}
      moveItem={moveItem}
      onDrop={store.saveItemGroupOrder}
      onClick={handleCardClick}
      isClickable={!isEditMode}
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
            !userStore.isAdmin && userStore.isSeriesPaid(seriesId) ? (
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
      
      {/* Action buttons for edit mode */}
      {isEditMode && (
        <CardEditActions
          item={series}
          store={store}
          hideDelete={item => item.deleted}
        />
      )}
    </DndOrderContainer>
      
      {/* Render dialogs only for the first card */}
      {/* {renderDialogs && (
        <>
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

          {(groupedSeriesStore.isEditSeriesDialogOpen || editSeriesStore.series) && (
            <EditSeriesPage
              onClose={groupedSeriesStore.closeEditSeriesDialog}
            />
          )}

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
      )} */}
    </>
  );
});

export default SeriesCard;

