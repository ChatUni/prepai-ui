import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import Button from '../../ui/Button';
import { t } from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import seriesStore from '../../../stores/seriesStore';
import EditCoursePage from './EditCoursePage';
import CourseCard from './CourseCard';
import MediaUpload from '../../ui/MediaUpload';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import LoadingState from '../../ui/LoadingState';
import Dialog from '../../ui/Dialog';
import StepDialog from '../../ui/StepDialog';

const Step1Content = observer(() => (
  <FormSelect store={seriesStore} field="group" options={clientStore.client.settings.seriesGroups} required />
));

const Step2Content = observer(() => (
  <div className="space-y-6">
    <FormInput store={seriesStore} field="name" required />

    {/* Category Input */}
    <div className="space-y-3">
      <label htmlFor="category" className="block text-sm font-medium">
        {t('series.edit.category')}
      </label>
      <input
        id="category"
        type="text"
        value={seriesStore.category}
        onChange={(e) => seriesStore.setCategory(e.target.value)}
        className="w-full p-2 border rounded bg-white"
        placeholder={t('series.edit.categoryPlaceholder')}
      />
      <div className="flex flex-wrap gap-2">
        {seriesStore.uniqueCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
              ${category === seriesStore.category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => seriesStore.setCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>

  </div>
));

const Step3Content = observer(() => (
  <div className="space-y-6">
    <ImageUpload store={seriesStore} field="image" required />
  </div>
));

const Step4Content = observer(() => (
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
          id="description"
          value={seriesStore.description}
          onChange={(e) => seriesStore.setDescription(e.target.value)}
          rows={5}
          className="w-full p-2 border rounded bg-white"
          required={seriesStore.descType === 'text'}
        />
      ) : (
        <MediaUpload
          id="desc_image"
          previewUrl={seriesStore.descImage}
          onMediaSelect={seriesStore.setDescImage}
          type="image"
          required={seriesStore.descType === 'image'}
        />
      )}
    </div>
  </div>
));

const Step5Content = observer(() => (
  <div className="space-y-6">
    {/* Price Input */}
    <div className="space-y-1">
      <label htmlFor="price" className="block text-sm font-medium">
        {t('series.edit.price')}
      </label>
      <input
        id="price"
        type="number"
        value={seriesStore.price}
        onChange={(e) => seriesStore.setPrice(e.target.value)}
        className="w-full p-2 border rounded bg-white"
        required
      />
    </div>

    {/* Duration Select */}
    <div className="space-y-1">
      <label htmlFor="duration" className="block text-sm font-medium">
        {t('series.edit.duration')}
      </label>
      <select
        id="duration"
        value={seriesStore.duration}
        onChange={(e) => seriesStore.setDuration(e.target.value)}
        className="w-full p-2 border rounded bg-white"
        required
      >
        {seriesStore.durationOptions.map(({ key, value }) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </select>
    </div>
  </div>
));

const Step6Content = observer(() => {
  const courses = seriesStore.courses || [];

  const handleMoveCourse = (dragIndex, dropIndex) => {
    const [removed] = courses.splice(dragIndex, 1);
    courses.splice(dropIndex, 0, removed);
    seriesStore.setCourses(courses);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => seriesStore.openEditCourseDialog()}
        className="w-full"
      >
        {t('series.addChapter')}
      </Button>
      {courses.map((course, idx) => (
        <CourseCard
          key={course.id}
          course={course}
          isEditMode={true}
          onEdit={() => seriesStore.openEditCourseDialog(course)}
          index={idx}
          moveItem={handleMoveCourse}
        />
      ))}
    </div>
  );
});

const EditSeriesPage = observer(({ onClose, onSave }) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleComplete = async () => {
    try {
      await seriesStore.saveSeries();
      seriesStore.reset();
      onClose();
    } catch (error) {
      console.error('Failed to save series:', error);
    }
  };

  return (
    <LoadingState
      isLoading={seriesStore.isLoading}
      customMessage={t('series.edit.loading')}
    >
      <>
        {/* <EditCourseDialog /> */}
        <StepDialog
          isOpen={true}
          onClose={handleCancel}
          isSteps={true}
          stepTitles={[
            t('series.edit.steps.selectGroup'),
            t('series.edit.steps.nameAndCategory'),
            t('series.edit.steps.cover'),
            t('series.edit.steps.description'),
            t('series.edit.steps.priceAndDuration'),
            t('series.edit.steps.courses')
          ]}
          validateStep={seriesStore.validateStep}
          onComplete={handleComplete}
        >
          <Step1Content />
          <Step2Content />
          <Step3Content />
          <Step4Content />
          <Step5Content />
          <Step6Content />
        </StepDialog>

        {/* <Dialog
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => {
            setShowCancelConfirm(false);
            seriesStore.reset();
            onClose();
          }}
          title={t('common.confirm')}
          isConfirm={true}
        >
          <p>{t('common.closeWithoutSaving')}</p>
        </Dialog> */}
      </>
    </LoadingState>
  );
});

// const EditCourseDialog = observer(() => (
//   <Dialog
//     isOpen={seriesStore.editCourseDialogOpen}
//     onClose={seriesStore.closeEditCourseDialog}
//     onConfirm={seriesStore.updateCourse}
//     title={editCourseStore.editingCourse ? t('course.editCourse') : t('course.addCourse')}
//     size="xl"
//     isConfirm={true}
//   >
//     <EditCoursePage
//       courseId={seriesStore.currentEditCourse?.id}
//       seriesId={seriesStore.editingSeries?.id}
//     />
//   </Dialog>
// ));

export default EditSeriesPage;