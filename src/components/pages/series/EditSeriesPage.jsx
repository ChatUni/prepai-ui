import { observer } from 'mobx-react-lite';
import editSeriesStore from '../../../stores/editSeriesStore';
import languageStore from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import MediaUpload from '../../ui/MediaUpload';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import LoadingState from '../../ui/LoadingState';

const EditSeriesPage = observer(() => {
  const { t } = languageStore;

  const content = (
    <div className="container mx-auto">
      <div className="bg-white rounded-lg">
        <form className="space-y-6">
          {/* Name Input */}
          <FormInput
            id="name"
            label={t('series.edit.name')}
            value={editSeriesStore.name}
            onChange={(e) => editSeriesStore.setName(e.target.value)}
            required
          />

          {/* Category Input */}
          <div className="space-y-1">
            <label htmlFor="category" className="block text-sm font-medium">
              {t('series.edit.category')}
            </label>
            <div className="relative">
              <input
                id="category"
                type="text"
                value={editSeriesStore.category}
                onChange={(e) => editSeriesStore.setCategory(e.target.value)}
                onClick={editSeriesStore.toggleDropdown}
                className="w-full p-2 border rounded bg-white"
                placeholder={t('series.edit.categoryPlaceholder')}
              />
              {editSeriesStore.isDropdownOpen && editSeriesStore.uniqueCategories.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {editSeriesStore.uniqueCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        category === editSeriesStore.category ? 'bg-gray-50' : ''
                      }`}
                      onClick={() => editSeriesStore.setCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group Select */}
          <FormSelect
            id="group"
            label={t('series.groups.title')}
            value={editSeriesStore.group}
            onChange={(e) => editSeriesStore.setGroup(e.target.value)}
            options={[
              { value: '', label: t('series.groups.noGroup') },
              ...clientStore.client.settings.groups.map(group => ({
                value: group,
                label: group
              }))
            ]}
          />

          {/* Price Input */}
          <FormInput
            id="price"
            type="number"
            label={t('series.edit.price')}
            value={editSeriesStore.price}
            onChange={(e) => editSeriesStore.setPrice(e.target.value)}
            required
          />

          {/* Duration Select */}
          <FormSelect
            id="duration"
            label={t('series.edit.duration')}
            value={editSeriesStore.duration}
            onChange={(e) => editSeriesStore.setDuration(e.target.value)}
            options={editSeriesStore.durationOptions.map(({ key, value }) => ({
              value: key,
              label: value
            }))}
            required
          />

          {/* Cover Image Upload */}
          <MediaUpload
            id="cover_image"
            label={t('series.edit.image')}
            previewUrl={editSeriesStore.image}
            onMediaSelect={editSeriesStore.setImage}
            type="image"
          />

          {/* Description Type Selection */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">
                {t('series.edit.description')}
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="desc_type"
                    value="text"
                    checked={editSeriesStore.descType === 'text'}
                    onChange={(e) => editSeriesStore.setDescType(e.target.value)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">{t('series.edit.descriptionType.text')}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="desc_type"
                    value="image"
                    checked={editSeriesStore.descType === 'image'}
                    onChange={(e) => editSeriesStore.setDescType(e.target.value)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">{t('series.edit.descriptionType.image')}</span>
                </label>
              </div>
            </div>

            {editSeriesStore.descType === 'text' ? (
              <FormInput
                id="description"
                value={editSeriesStore.description}
                onChange={(e) => editSeriesStore.setDescription(e.target.value)}
                rows={5}
                required={editSeriesStore.descType === 'text'}
              />
            ) : (
              <MediaUpload
                id="desc_image"
                previewUrl={editSeriesStore.descImage}
                onMediaSelect={editSeriesStore.setDescImage}
                type="image"
                required={editSeriesStore.descType === 'image'}
              />
            )}
          </div>

          {/* Error message */}
          {editSeriesStore.error && (
            <div className="text-red-600 text-sm">{editSeriesStore.error}</div>
          )}
        </form>
      </div>
    </div>
  );

  return (
    <LoadingState
      isLoading={editSeriesStore.isLoading}
      customMessage={t('series.edit.loading')}
    >
      {content}
    </LoadingState>
  );
});

export default EditSeriesPage;