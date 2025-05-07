import React from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator } from 'react-icons/md';
import { FiEdit2 } from 'react-icons/fi';
import routeStore from '../../../stores/routeStore';
import languageStore from '../../../stores/languageStore';
import seriesCardStore from '../../../stores/seriesCardStore';
import coursesStore from '../../../stores/coursesStore';
import useDragAndDrop from '../../../hooks/useDragAndDrop';
import CourseCard from '../../ui/CourseCard';
import Dialog from '../../ui/Dialog';
import EditCoursePage from './EditCoursePage';

const SeriesCard = observer(({ series, index, moveItem }) => {
  const { t } = languageStore;
  const navigate = useNavigate();
  
  const validatedSeries = seriesCardStore.validateSeries(series);
  if (!validatedSeries) return null;

  const { id: seriesId, name, desc, cover, group, price } = validatedSeries;
  const coverImage = seriesCardStore.getCoverImage(cover);
  const courseCount = seriesCardStore.getCourseCount(seriesId);
  const instructors = seriesCardStore.getFormattedInstructors(series);

  const handleMoveCourse = (dragIndex, dropIndex) => {
    const courses = coursesStore.courses
      .filter(course => course?.series?.id === seriesId || course?.series?._id === seriesId);
    const [removed] = courses.splice(dragIndex, 1);
    courses.splice(dropIndex, 0, removed);
    coursesStore.saveSeriesUpdates().catch(error => {
      console.error('Failed to save course updates:', error);
    });
  };

  const { isDragging, isOver, handleRef } = useDragAndDrop({
    type: `series-${group}`,
    index,
    moveItem,
    onDrop: () => {
      coursesStore.saveSeriesUpdates().catch(error => {
        console.error('Failed to save series updates:', error);
      });
    }
  });

  return (
    <div
      ref={routeStore.isSeriesSettingMode ? handleRef : null}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${isDragging ? 'opacity-50' : ''} ${isOver ? 'border-2 border-blue-500' : ''}`}
    >
      <div
        onClick={(e) => seriesCardStore.handleSeriesClick(seriesId, navigate, e)}
        className={`cursor-${routeStore.isSeriesSettingMode ? 'move' : 'pointer'}`}
      >
        <div className="relative pb-[56.25%]">
          <img
            src={coverImage}
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
              {instructors.length > 0 ? instructors.map((instructor, index) => (
                <div key={instructor.id || instructor._id} className="flex items-center">
                  {instructor?.iconUrl ? (
                    <img
                      src={instructor.iconUrl}
                      alt={instructor.name}
                      className="w-6 h-6 rounded-full mr-1"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 mr-1 flex items-center justify-center">
                      <span className="text-xs text-gray-600">{instructor?.name?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {instructor?.name}
                    {index < instructors.length - 1 && ", "}
                  </span>
                </div>
              )) : (
                <span className="text-sm text-gray-600 dark:text-gray-300">{seriesCardStore.unknownInstructorText}</span>
              )}
            </div>
            {price > 0 && (
              <span className="text-red-600 dark:text-red-300 font-bold">${price}</span>
            )}
          </div>
          
          {desc && !desc.startsWith('http') && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 h-10 mb-2">
              {desc}
            </p>
          )}
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  seriesCardStore.toggleCourseList(seriesId);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {seriesCardStore.getCourseCountText(courseCount, seriesId)}
              </button>
              {routeStore.isSeriesSettingMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seriesCardStore.openEditDialog(series);
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title={t('series.edit')}
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <MdDragIndicator
                    className="text-gray-400 text-xl cursor-move"
                    aria-label="Drag to reorder"
                  />
                </div>
              )}
            </div>
            {seriesCardStore.isExpanded(seriesId) && (
              <div className="border-t pt-2 space-y-2">
                {coursesStore.courses
                  .filter(course => course?.series?.id === seriesId || course?.series?._id === seriesId)
                  .map((course, idx) => (
                    <CourseCard
                      key={course.id || course._id}
                      course={course}
                      isEditMode={routeStore.isSeriesSettingMode}
                      onEdit={() => seriesCardStore.openEditCourseDialog(course, seriesId)}
                      index={idx}
                      moveItem={handleMoveCourse}
                    />
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const EditCourseDialog = observer(() => {
  const { t } = languageStore;
  const { editCourseDialogOpen, currentEditCourse, currentSeriesId, closeEditCourseDialog } = seriesCardStore;

  if (!editCourseDialogOpen || !currentEditCourse) return null;

  return (
    <Dialog
      isOpen={editCourseDialogOpen}
      onClose={closeEditCourseDialog}
      title={t('course.editCourse')}
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <EditCoursePage courseId={currentEditCourse.id} seriesId={currentSeriesId} />
      </div>
    </Dialog>
  );
});

// Render EditCourseDialog at the root level where SeriesCard is used
const SeriesCardWithDialog = observer(({ series, index, moveItem }) => {
  return (
    <>
      <SeriesCard series={series} index={index} moveItem={moveItem} />
      <EditCourseDialog />
    </>
  );
});

export default SeriesCardWithDialog;