import React from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator, MdAdd } from 'react-icons/md';
import { FiEdit2 } from 'react-icons/fi';
import ExpandArrow from '../../ui/ExpandArrow';
import routeStore from '../../../stores/routeStore';
import languageStore from '../../../stores/languageStore';
import seriesCardStore from '../../../stores/seriesCardStore';
import seriesStore from '../../../stores/seriesStore';
import coursesStore from '../../../stores/coursesStore';
import useDragAndDrop from '../../../hooks/useDragAndDrop';
import CourseCard from './CourseCard';

const SeriesCard = observer(({ series, index, moveItem }) => {
  const { t } = languageStore;
  const navigate = useNavigate();
  
  const validatedSeries = seriesCardStore.validateSeries(series);
  if (!validatedSeries) return null;

  const { id: seriesId, name, desc, cover, group, price } = validatedSeries;
  const image = seriesCardStore.getImage(cover);
  const instructors = seriesStore.getSeriesInstructors(series);
  const courses = series.courses || [];

  const handleMoveCourse = (dragIndex, dropIndex) => {
    const courses = coursesStore.courses
      .filter(course => course?.series?.id === seriesId);
    const [removed] = courses.splice(dragIndex, 1);
    courses.splice(dropIndex, 0, removed);
    return coursesStore.saveSeriesUpdates();
  };

  const { isDragging, isOver, handleRef } = useDragAndDrop({
    type: `series-${group}`,
    index,
    moveItem,
    onDrop: seriesStore.saveSeriesUpdates
  });

  return (
    <div
      ref={routeStore.isSeriesSettingMode ? handleRef : null}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${isDragging ? 'opacity-50' : ''} ${isOver ? 'border-2 border-blue-500' : ''}`}
    >
      <div
        onClick={routeStore.isSeriesSettingMode ? undefined : (e) => seriesCardStore.handleSeriesClick(seriesId, navigate, e)}
        className={`${!routeStore.isSeriesSettingMode && 'cursor-pointer'}`}
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
                  className={`flex items-center ${routeStore.isSeriesSettingMode ? 'cursor-pointer hover:opacity-80' : ''}`}
                  onClick={routeStore.isSeriesSettingMode ? (e) => {
                    e.stopPropagation();
                    seriesCardStore.openEditInstructorDialog(instructor);
                  } : undefined}
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
                    {routeStore.isSeriesSettingMode && (
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
              <span className="text-red-600 dark:text-red-300 font-bold">${price}</span>
            )}
          </div>
          
          {desc && !desc.startsWith('http') && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {desc}
            </p>
          )}
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              {routeStore.isSeriesSettingMode ? (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seriesCardStore.openEditCourseDialog(null, seriesId);
                    }}
                    className="text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-green-500 dark:hover:bg-green-600 rounded transition-colors !min-h-0 h-5 leading-none flex items-center gap-1"
                    title={t('series.addCourse')}
                  >
                    <MdAdd size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seriesCardStore.toggleCourseList(seriesId);
                    }}
                    className="text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors !min-h-0 h-5 leading-none flex items-center gap-1"
                  >
                    {seriesCardStore.getCourseCountText(courses.length, seriesId)}
                    <ExpandArrow isExpanded={seriesCardStore.isExpanded(seriesId)} className="text-white" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('series.courseCount', { count: courses.length})}</p>
              )}
              {routeStore.isSeriesSettingMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seriesCardStore.openEditDialog(series);
                    }}
                    className="text-gray-500 hover:text-gray-800 transition-colors"
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
                {courses.map((course, idx) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEditMode={routeStore.isSeriesSettingMode}
                    onEdit={() => seriesCardStore.openEditCourseDialog(course, seriesId)}
                    index={idx}
                    moveItem={handleMoveCourse}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SeriesCard;