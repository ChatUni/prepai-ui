import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import editSeriesStore from '../../../stores/editSeriesStore';
import languageStore from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import seriesStore from '../../../stores/seriesStore';
import MediaUpload from '../../ui/MediaUpload';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import LoadingState from '../../ui/LoadingState';
import Dialog from '../../ui/Dialog';
import StepDialog from '../../ui/StepDialog';

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

const validateStep = (step) => {
  const { t } = languageStore;
  
  switch (step) {
    case 1:
      if (!editSeriesStore.canProceedToStep2) {
        return t('series.edit.errors.groupRequired');
      }
      break;
    case 2:
      if (!editSeriesStore.name.trim() || !editSeriesStore.category.trim()) {
        return t('series.edit.errors.nameAndCategoryRequired');
      }
      break;
    case 3:
      if (!editSeriesStore.image) {
        return t('series.edit.errors.coverImageRequired');
      }
      break;
    case 4:
      if (editSeriesStore.descType === 'text' && !editSeriesStore.description.trim()) {
        return t('series.edit.errors.descriptionRequired');
      }
      if (editSeriesStore.descType === 'image' && !editSeriesStore.descImage) {
        return t('series.edit.errors.descriptionImageRequired');
      }
      break;
    case 5:
      if (!editSeriesStore.price || !editSeriesStore.duration) {
        return t('series.edit.errors.priceAndDurationRequired');
      }
      break;
    default:
      return null;
  }
  return null;
};

const EditSeriesPage = observer(({ onClose, onSave }) => {
  const { t } = languageStore;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleComplete = () => {
    editSeriesStore.saveSeries();
    onSave();
  };

  return (
    <LoadingState
      isLoading={editSeriesStore.isLoading}
      customMessage={t('series.edit.loading')}
    >
      <>
        <StepDialog
          isOpen={true}
          onClose={handleCancel}
          isSteps={true}
          stepTitles={[
            t('series.edit.steps.selectGroup'),
            t('series.edit.steps.nameAndCategory'),
            t('series.edit.steps.cover'),
            t('series.edit.steps.description'),
            t('series.edit.steps.priceAndDuration')
          ]}
          validateStep={validateStep}
          onComplete={handleComplete}
        >
          <Step1Content />
          <Step2Content />
          <Step3Content />
          <Step4Content />
          <Step5Content />
        </StepDialog>

        <Dialog
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => {
            setShowCancelConfirm(false);
            onClose();
          }}
          title={t('common.confirm')}
          isConfirm={true}
        >
          <p>{t('common.closeWithoutSaving')}</p>
        </Dialog>
      </>
    </LoadingState>
  );
});

export default EditSeriesPage;