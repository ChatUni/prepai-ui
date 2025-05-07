import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import seriesStore from '../../../stores/seriesStore';
import languageStore from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import LoadingState from '../../ui/LoadingState';
import ImageUpload from '../../ui/ImageUpload';

const EditSeriesPage = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const formRef = useRef(null);

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
      if (seriesStore.currentSeriesId) {
        await seriesStore.fetchSeriesById(seriesStore.currentSeriesId);
      } else {
        seriesStore.setCurrentSeries({
          name: '',
          desc: '',
          instructor: null,
          cover: '',
          category: '',
          group: ''
        });
      }
    };
    loadSeries();
  }, []);

  const content = (
    <div className="p-4 w-full h-full flex flex-col">
      <form
        ref={formRef}
        className="space-y-4 w-full max-w-4xl mx-auto flex-1 flex flex-col edit-series-form"
      >
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
            {t('series.groups.title')}
          </label>
          <div className="relative">
            <select
              name="group"
              value={seriesStore.currentSeries?.group || ''}
              onChange={(e) => seriesStore.setCurrentSeries({ ...seriesStore.currentSeries, group: e.target.value })}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="">{t('series.groups.noGroup')}</option>
              {clientStore.client.settings.groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('series.edit.price')}
          </label>
          <input
            type="number"
            name="price"
            defaultValue={seriesStore.currentSeries?.price || ''}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('series.edit.duration')}
          </label>
          <select
            name="duration"
            defaultValue={seriesStore.currentSeries?.duration || '30days'}
            className="w-full p-2 border rounded bg-white"
            required
          >
            {seriesStore.durationOptionKeys.map((key) => (
              <option key={key} value={key}>
                {t(`series.edit.durationOptions.${key}`)}
              </option>
            ))}
          </select>
        </div>

        <ImageUpload
          id="cover_image"
          label={t('series.edit.coverImage')}
          previewUrl={seriesStore.selectedImagePreview || seriesStore.currentSeries?.cover}
          onImageSelect={(file) => seriesStore.setSelectedImagePreview(file)}
          buttonText={seriesStore.selectedImagePreview ? t('series.edit.changeImage') : t('series.edit.selectImage')}
          selectedText={seriesStore.selectedImagePreview ? t('series.edit.fileSelected') : null}
        />

        <div className="flex-1 overflow-auto">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">
              {t('series.edit.description')}
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="desc_type"
                  value="text"
                  checked={seriesStore.descType === 'text'}
                  onChange={(e) => seriesStore.setDescType(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">{t('series.edit.descriptionType.text')}</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="desc_type"
                  value="image"
                  checked={seriesStore.descType === 'image'}
                  onChange={(e) => seriesStore.setDescType(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">{t('series.edit.descriptionType.image')}</span>
              </label>
            </div>
          </div>

          {seriesStore.descType === 'text' ? (
            <textarea
              name="description"
              defaultValue={seriesStore.currentSeries?.desc || ''}
              className="w-full p-2 border rounded h-32"
              required={seriesStore.descType === 'text'}
            />
          ) : (
            <ImageUpload
              id="desc_image"
              label=""
              previewUrl={seriesStore.selectedDescImagePreview}
              onImageSelect={(file) => seriesStore.setSelectedDescImagePreview(file)}
              buttonText={seriesStore.selectedDescImagePreview ? t('series.edit.changeImage') : t('series.edit.selectImage')}
              required={seriesStore.descType === 'image'}
            />
          )}
        </div>

      </form>
    </div>
  );

  return (
    <LoadingState
      isLoading={seriesStore.isLoading}
      customMessage={t('series.edit.loading')}
    >
      {content}
    </LoadingState>
  );
});

export default EditSeriesPage;