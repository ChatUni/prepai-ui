import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { seriesStore } from '../stores/seriesStore';

const EditSeriesPage = observer(() => {
  const navigate = useNavigate();
  const seriesId = seriesStore.currentSeriesId;

  useEffect(() => {
    seriesStore.fetchInstructors();
    if (seriesId) {
      seriesStore.fetchSeriesById(seriesId);
    } else {
      seriesStore.setCurrentSeries({
        name: '',
        description: '',
        instructor_id: '',
        cover_image: ''
      });
    }
  }, [seriesId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Convert instructor_id to number
    const instructorId = formData.get('instructor_id');
    formData.set('instructor_id', parseInt(instructorId));
    
    // Add series ID if editing
    if (seriesId) {
      formData.append('id', parseInt(seriesId));
    }

    try {
      await seriesStore.saveSeries(formData, navigate);
    } catch (error) {
      console.error('保存系列失败：', error);
      // TODO: Add proper error message display to user
    }
  };

  if (seriesStore.isLoading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">
        {seriesId ? '编辑系列' : '创建新系列'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-4xl mx-auto">
        <div>
          <label className="block text-sm font-medium mb-1">
            讲师
          </label>
          <select
            name="instructor_id"
            defaultValue={seriesStore.currentSeries?.instructor_id || ''}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">请选择讲师</option>
            {seriesStore.instructors.map(instructor => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            系列名称
          </label>
          <input
            type="text"
            name="name"
            defaultValue={seriesStore.currentSeries?.name || ''}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            描述
          </label>
          <textarea
            name="description"
            defaultValue={seriesStore.currentSeries?.description || ''}
            className="w-full p-2 border rounded h-32"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            封面图片
          </label>
          <div className="relative">
            <input
              type="file"
              id="cover_image"
              name="cover_image"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                seriesStore.setSelectedImagePreview(file);
              }}
              className="hidden"
              required={!seriesStore.currentSeries?.cover_image}
            />
            <label
              htmlFor="cover_image"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">
                {seriesStore.selectedImagePreview ? '更改图片' : '选择图片'}
              </span>
            </label>
            {seriesStore.selectedImagePreview && (
              <div className="mt-2 text-sm text-gray-500">
                已选择文件
              </div>
            )}
          </div>
          {(seriesStore.selectedImagePreview || seriesStore.currentSeries?.cover_image) && (
            <div className="mt-2">
              <img
                src={seriesStore.selectedImagePreview || seriesStore.currentSeries.cover_image}
                alt="封面预览"
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={seriesStore.isLoading}
        >
          {seriesStore.isLoading ? '保存中...' : '保存系列'}
        </button>
      </form>
    </div>
  );
});

export default EditSeriesPage;