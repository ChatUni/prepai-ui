import { observer } from 'mobx-react-lite';
import store from '../../../stores/courseStore';
import CourseCard from './CourseCard';
import ListPage from '../../ui/ListPage';
import EditCoursePage from './EditCoursePage';
import { useEffect } from 'react';

const CourseListPage = observer(({ series }) => {
  useEffect(() => {
    store.setSeries(series);
  }, [series]);

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      <div className="bg-white">
        <ListPage
          isGrouped={false}
          showSearchBar={false}
          store={store}
          renderEdit={() => <EditCoursePage />}
          renderItem={(course, index, group, { moveItem, isEditMode }, isFirstCard) => (
            <CourseCard
              key={course.id}
              series={series}
              course={course}
              index={index}
              moveItem={moveItem}
              isEditMode={isEditMode}
              isDraggable={true}
              renderDialogs={isFirstCard}
            />
          )}
          itemsContainerClassName="grid grid-cols-1 gap-1 md:gap-4"
        />
      </div>
    </div>
  );
});

export default CourseListPage;