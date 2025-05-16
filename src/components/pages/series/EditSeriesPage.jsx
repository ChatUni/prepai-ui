import { observer } from 'mobx-react-lite';
import editSeriesStore from '../../../stores/editSeriesStore';
import languageStore from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import MediaUpload from '../../ui/MediaUpload';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import LoadingState from '../../ui/LoadingState';
import StepsContainer from '../../ui/StepsContainer';
import seriesStore from '../../../stores/seriesStore';

const Step1Content = observer(() => {
  const { t } = languageStore;
  
  return (
    <FormSelect
      id="group"
      label={t('series.groups.title')}
      value={editSeriesStore.group}
      onChange={(e) => editSeriesStore.setGroup(e.target.value)}
      options={clientStore.client.settings.groups.map(group => ({
        value: group,
        label: group
      }))}
    />
  );
});

const Step2Content = observer(() => {
  const { t } = languageStore;
  
  return (
    <div className="space-y-6">
      {/* Name Input */}
      <FormInput
        id="name"
        label={t('series.edit.name')}
        value={editSeriesStore.name}
        onChange={(e) => editSeriesStore.setName(e.target.value)}
        required
      />

      {/* Category Input */}
      <div className="space-y-3">
        <label htmlFor="category" className="block text-sm font-medium">
          {t('series.edit.category')}
        </label>
        <input
          id="category"
          type="text"
          value={editSeriesStore.category}
          onChange={(e) => editSeriesStore.setCategory(e.target.value)}
          className="w-full p-2 border rounded bg-white"
          placeholder={t('series.edit.categoryPlaceholder')}
        />
        <div className="flex flex-wrap gap-2">
          {seriesStore.uniqueCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${category === editSeriesStore.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => editSeriesStore.setCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
});

const Step3Content = observer(() => {
  const { t } = languageStore;
  
  return (
    <div className="space-y-6">
      {/* Cover Image Upload */}
      <MediaUpload
        id="cover_image"
        label={t('series.edit.image')}
        previewUrl={editSeriesStore.image}
        onMediaSelect={editSeriesStore.setImage}
        type="image"
      />
    </div>
  );
});

const Step4Content = observer(() => {
  const { t } = languageStore;
  
  return (
    <div className="space-y-6">
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
    </div>
  );
});

const Step5Content = observer(() => {
  const { t } = languageStore;
  
  return (
    <div className="space-y-6">
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
    </div>
  );
});

const EditSeriesPage = observer(() => {
  const { t } = languageStore;

  const handleNext = () => {
    if (editSeriesStore.currentStep === 1 && !editSeriesStore.canProceedToStep2) {
      editSeriesStore.setError(t('series.edit.errors.groupRequired'));
      return;
    }
    if (editSeriesStore.currentStep === 2) {
      if (!editSeriesStore.name.trim() || !editSeriesStore.category.trim()) {
        editSeriesStore.setError(t('series.edit.errors.nameAndCategoryRequired'));
        return;
      }
    }
    if (editSeriesStore.currentStep === 3) {
      if (!editSeriesStore.image) {
        editSeriesStore.setError(t('series.edit.errors.coverImageRequired'));
        return;
      }
    }
    if (editSeriesStore.currentStep === 4) {
      if (editSeriesStore.descType === 'text' && !editSeriesStore.description.trim()) {
        editSeriesStore.setError(t('series.edit.errors.descriptionRequired'));
        return;
      }
      if (editSeriesStore.descType === 'image' && !editSeriesStore.descImage) {
        editSeriesStore.setError(t('series.edit.errors.descriptionImageRequired'));
        return;
      }
    }
    if (editSeriesStore.currentStep === 5) {
      if (!editSeriesStore.price || !editSeriesStore.duration) {
        editSeriesStore.setError(t('series.edit.errors.priceAndDurationRequired'));
        return;
      }
    }
    editSeriesStore.clearError();
    editSeriesStore.nextStep();
  };

  const content = (
    <div className="container mx-auto">
      <div className="bg-white rounded-lg">
        <StepsContainer
          currentStep={editSeriesStore.currentStep}
          totalSteps={editSeriesStore.totalSteps}
          stepTitles={editSeriesStore.stepTitles}
          onNext={handleNext}
          onPrev={editSeriesStore.prevStep}
        >
          {editSeriesStore.currentStep === 1 && <Step1Content />}
          {editSeriesStore.currentStep === 2 && <Step2Content />}
          {editSeriesStore.currentStep === 3 && <Step3Content />}
          {editSeriesStore.currentStep === 4 && <Step4Content />}
          {editSeriesStore.currentStep === 5 && <Step5Content />}
        </StepsContainer>

        {/* Error message */}
        {editSeriesStore.error && (
          <div className="mt-4 text-red-600 text-sm">{editSeriesStore.error}</div>
        )}
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