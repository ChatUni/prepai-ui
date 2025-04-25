import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { seriesStore } from '../stores/seriesStore';
import languageStore from '../stores/languageStore';
import { tap } from '../../netlify/functions/utils';

const EditSeriesPage = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();
  const { id: seriesId } = useParams(); // Get ID directly from URL params
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  // Fetch all series to populate categories
  useEffect(() => {
    seriesStore.fetchSeries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        seriesStore.closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
      if (seriesId) {
        await seriesStore.fetchSeriesById(seriesId);
        console.log('Current series:', seriesStore.currentSeries); // Debug log
      } else {
        seriesStore.setCurrentSeries({
          name: '',
          desc: '',
          instructor: null,
          cover: '',
          category: ''
        });
      }
    };
    loadSeries();
  }, [seriesId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Create a new FormData with the correct structure
    const newFormData = new FormData();
    newFormData.append('name', formData.get('name'));
    newFormData.append('description', formData.get('description'));
    
    if (formData.get('cover_image')) {
      newFormData.append('cover_image', formData.get('cover_image'));
    }
    
    // Add series ID if editing
    if (seriesId) {
      newFormData.append('id', parseInt(seriesId));
    }

    try {
      await seriesStore.saveSeries(newFormData, navigate);
    } catch (error) {
      console.error(t('series.edit.saveError'), error);
      // TODO: Add proper error message display to user
    }
  };

  if (seriesStore.isLoading) {
    return <div className="p-4">{t('series.edit.loading')}</div>;
  }

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">
        {seriesId ? t('series.edit.editTitle') : t('series.edit.createTitle')}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-4xl mx-auto">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('series.edit.name')}
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
            {t('series.edit.category')}
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="flex">
              <input
                type="text"
                name="category"
                value={seriesStore.selectedCategory}
                onChange={(e) => seriesStore.setSelectedCategory(e.target.value, false)}
                onClick={() => seriesStore.toggleDropdown()}
                className="w-full p-2 border rounded-l bg-white"
                placeholder={t('series.edit.categoryPlaceholder')}
              />
              <button
                type="button"
                onClick={() => seriesStore.toggleDropdown()}
                className="px-2 border border-l-0 rounded-r bg-white"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${seriesStore.isDropdownOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {seriesStore.isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {seriesStore.uniqueCategories.length > 0 ? (
                  seriesStore.uniqueCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        category === seriesStore.selectedCategory ? 'bg-gray-50' : ''
                      }`}
                      onClick={() => seriesStore.setSelectedCategory(category, true)}
                    >
                      {category}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 italic">
                    {t('series.edit.noCategories')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('series.edit.coverImage')}
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
            />
            <label
              htmlFor="cover_image"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">
                {seriesStore.selectedImagePreview ? t('series.edit.changeImage') : t('series.edit.selectImage')}
              </span>
            </label>
            {seriesStore.selectedImagePreview && (
              <div className="mt-2 text-sm text-gray-500">
                {t('series.edit.fileSelected')}
              </div>
            )}
          </div>
          {(seriesStore.selectedImagePreview || seriesStore.currentSeries?.cover) && (
            <div className="mt-2">
              <img
                src={seriesStore.selectedImagePreview || seriesStore.currentSeries.cover}
                alt={t('series.edit.coverPreview')}
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('series.edit.description')}
          </label>
          <textarea
            name="description"
            defaultValue={seriesStore.currentSeries?.desc || ''}
            className="w-full p-2 border rounded h-32"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={seriesStore.isLoading}
        >
          {seriesStore.isLoading ? t('series.edit.saving') : t('series.edit.saveSeries')}
        </button>
      </form>
    </div>
  );
});

export default EditSeriesPage;