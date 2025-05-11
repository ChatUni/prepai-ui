import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import seriesStore from '../../../stores/seriesStore';
import editCourseStore from '../../../stores/editCourseStore';
import languageStore from '../../../stores/languageStore';
import MediaUpload from '../../ui/MediaUpload';

const EditCoursePage = observer(() => {
  const { t } = languageStore;

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <form className="space-y-6">
          {/* Instructor Selection */}
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
              {t('course.add.instructor')}
            </label>
            <select
              id="instructor"
              value={editCourseStore.instructor_id || ''}
              onChange={(e) => editCourseStore.setInstructorId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">{t('course.add.selectInstructor')}</option>
              {seriesStore.instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('course.add.courseName')}
            </label>
            <input
              type="text"
              id="title"
              value={editCourseStore.title}
              onChange={(e) => editCourseStore.setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Course Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              {t('course.add.duration')}
            </label>
            <input
              type="number"
              id="duration"
              value={editCourseStore.duration}
              onChange={(e) => editCourseStore.setDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              min="0"
              required
            />
          </div>

          {/* <MediaUpload
            id="cover-upload"
            type="image"
            label={t('course.add.coverImage')}
            previewUrl={editCourseStore.imagePreview}
            onMediaSelect={(file) => editCourseStore.setImage(file)}
            className="space-y-2"
          /> */}

          <MediaUpload
            id="video-upload"
            type="video"
            label={t('course.add.courseVideo')}
            previewUrl={editCourseStore.videoFile}
            onMediaSelect={(file) => editCourseStore.setVideoFile(file)}
            className="space-y-2"
            required
          />

          {/* Error Message */}
          {editCourseStore.error && (
            <div className="text-red-600 text-sm">{editCourseStore.error}</div>
          )}
        </form>
      </div>
    </div>
  );
});

export default EditCoursePage;