import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { seriesStore } from '../stores/seriesStore';
import { newCourseStore } from '../stores/newCourseStore';

const AddCoursePage = observer(() => {
  const { seriesId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    seriesStore.fetchSeriesById(seriesId);
    return () => {
      newCourseStore.reset();
    };
  }, [seriesId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await newCourseStore.saveCourse(seriesId, navigate);
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  if (seriesStore.isLoading || !seriesStore.currentSeries) {
    return <div className="p-4">加载中...</div>;
  }

  const { currentSeries } = seriesStore;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Series Details Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {currentSeries.cover && (
              <img 
                src={currentSeries.cover} 
                alt={currentSeries.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold mb-2">{currentSeries.name}</h3>
            {/* <p className="text-gray-600 mb-2">
              讲师: {currentSeries.instructor?.name}
            </p> */}
            <p className="text-gray-700">{currentSeries.description}</p>
          </div>
        </div>
      </div>

      {/* New Course Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">添加新课程</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              课程名称
            </label>
            <input
              type="text"
              id="name"
              value={newCourseStore.name}
              onChange={(e) => newCourseStore.setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Course Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              课程描述
            </label>
            <textarea
              id="description"
              value={newCourseStore.description}
              onChange={(e) => newCourseStore.setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图片
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => newCourseStore.setCoverImage(e.target.files[0])}
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
                  {newCourseStore.coverImagePreview ? '更改图片' : '选择图片'}
                </span>
              </label>
              {newCourseStore.coverImagePreview && (
                <div className="mt-2 text-sm text-gray-500">
                  已选择文件
                </div>
              )}
            </div>
            {newCourseStore.coverImagePreview && (
              <div className="mt-2">
                <img
                  src={newCourseStore.coverImagePreview}
                  alt="封面预览"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              课程视频
            </label>
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => newCourseStore.setVideoFile(e.target.files[0])}
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
                  {newCourseStore.videoFile ? '更改视频' : '选择视频'}
                </span>
              </label>
              {newCourseStore.videoFile && (
                <div className="mt-2 text-sm text-gray-500">
                  已选择文件: {newCourseStore.videoFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {newCourseStore.error && (
            <div className="text-red-600 text-sm">{newCourseStore.error}</div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={newCourseStore.isLoading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                newCourseStore.isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {newCourseStore.isLoading ? '保存中...' : '添加课程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default AddCoursePage;