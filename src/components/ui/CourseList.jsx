import { observer } from 'mobx-react-lite';
import CourseCard from './CourseCard';
import coursesStore from '../../stores/coursesStore';

const CourseList = observer(({ title, courses }) => {
  console.log(`CourseList - ${title}:`, courses);
  console.log(`CourseList - ${title} - Number of courses:`, courses.length);
  
  return (
    <div className="w-full">
      {title && (
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {courses.map((course, index) => (
          <CourseCard key={`${title}-${course.id}-${index}`} course={course} />
        ))}
      </div>
      <div className="mt-4 text-gray-500">
        Showing {courses.length} courses
      </div>
    </div>
  );
});

export default CourseList;
