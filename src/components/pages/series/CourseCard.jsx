import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FcLock } from "react-icons/fc";
import seriesStore from '../../../stores/seriesStore';
import paymentManagerStore from '../../../stores/paymentManagerStore';
import userStore from '../../../stores/userStore';
import DndOrderContainer from '../../ui/DndOrderContainer';
import CardEditActions from '../../ui/CardEditActions';
import courseStore from '../../../stores/courseStore';
import { t } from '../../../stores/languageStore';

const CourseCard = observer(({ series, course, isEditMode, index, moveItem }) => {
  const navigate = useNavigate();
  const instructor = seriesStore.getInstructorById(course.instructor_id);

  const handleCardClick = () => {
    if (!course.isFree && !seriesStore.isPaid(series.id)) {
      paymentManagerStore.setShowSeriesDialog(true, series);
      return;
    }

    if (course.isVideo) {
      navigate(`/video/${series.id}/${course.id}`);
    } else {
      navigate(`/ppt/${series.id}/${course.id}`);
    }
  };

  return (
    <DndOrderContainer
      isEditMode={isEditMode}
      type="course"
      index={index}
      moveItem={moveItem}
      onClick={isEditMode ? undefined : handleCardClick}
      isClickable={!isEditMode}
      className="flex flex-col w-full relative group mb-4"
    >
      <div className="w-full h-full">
        <div className="p-3 relative">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-sm sm:text-base line-clamp-2 flex-1">{course.title}</h3>
            {!seriesStore.isPaid(series.id) && (course.isFree ? (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                {t('course.isFree')}
              </span>
            ) :
            !seriesStore.isSettingRoute && (
              <FcLock />
            ))}
          </div>
          
          <div className="flex items-center mt-1">
            {instructor?.image ? (
              <img
                src={instructor.image}
                alt={instructor.name}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-1.5"
              />
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 mr-1.5 flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {instructor?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <p className="text-gray-600 text-xs sm:text-sm">{instructor?.name}</p>
            {course.duration && (
              <>
                <span className="text-gray-400 mx-1.5">•</span>
                <p className="text-gray-600 text-xs sm:text-sm">{course.duration} {t('course.minutes')}</p>
              </>
            )}
          </div>

          {isEditMode && (
            <CardEditActions
              store={courseStore}
              item={course}
              hideDelete={() => true}
            />
          )}
        </div>
      </div>
    </DndOrderContainer>
  );
});

export default CourseCard;
