import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import seriesStore from '../../../stores/seriesStore';
import editCourseStore from '../../../stores/editCourseStore';
import languageStore from '../../../stores/languageStore';

const EditCoursePage = observer(() => {
  const { t } = languageStore;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await editCourseStore.saveCourse(seriesId);
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instructor Selection */}
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
              {t('course.add.instructor')}
            </label>
            <select
              id="instructor"
              value={editCourseStore.instructor_id || ''}
              onChange={(e) => editCourseStore.setInstructorId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('course.add.coverImage')}
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => editCourseStore.setImage(e.target.files[0])}
                className="hidden"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">
                  {editCourseStore.imagePreview ? t('course.add.changeImage') : t('course.add.selectImage')}
                </span>
              </label>
              {editCourseStore.imagePreview && (
                <div className="mt-2 text-sm text-gray-500">
                  {t('course.add.fileSelected')}
                </div>
              )}
            </div>
            {editCourseStore.imagePreview && (
              <div className="mt-2">
                <img
                  src={editCourseStore.imagePreview}
                  alt={t('course.add.coverImage')}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('course.add.courseVideo')}
            </label>
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => editCourseStore.setVideoFile(e.target.files[0])}
                className="hidden"
                id="video-upload"
                required
              />
              <label
                htmlFor="video-upload"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">
                  {editCourseStore.videoFile ? t('course.add.changeVideo') : t('course.add.selectVideo')}
                </span>
              </label>
              {editCourseStore.videoFile && (
                <div className="mt-2 text-sm text-gray-500">
                  {t('course.add.fileSelected')}: {editCourseStore.videoFile.name}
                </div>
              )}
            </div>
          </div>

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