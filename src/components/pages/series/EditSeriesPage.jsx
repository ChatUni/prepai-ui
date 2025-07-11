import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import Button from '../../ui/Button';
import { t } from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import store from '../../../stores/seriesStore';
import CourseCard from './CourseCard';
import MediaUpload from '../../ui/MediaUpload';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import ImageUpload from '../../ui/ImageUpload';

const steps = [
  () => (
    <FormSelect store={store} field="group" options={clientStore.client.settings.seriesGroups} required />
  ),

  () => (
    <div className="space-y-6">
      <FormInput store={store} field="name" required />
      <FormInput store={store} field="category" choices={store.uniqueCategories} required />
    </div>
  ),

  () => (
    <div className="space-y-6">
      <ImageUpload store={store} field="image" required />
    </div>
  ),

  () => (
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
                checked={store.descType === 'text'}
                onChange={(e) => store.setDescType(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">{t('series.edit.descriptionType.text')}</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="desc_type"
                value="image"
                checked={store.descType === 'image'}
                onChange={(e) => store.setDescType(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">{t('series.edit.descriptionType.image')}</span>
            </label>
          </div>
        </div>

        {store.descType === 'text' ? (
          <textarea
            id="description"
            value={store.description}
            onChange={(e) => store.setDescription(e.target.value)}
            rows={5}
            className="w-full p-2 border rounded bg-white"
            required={store.descType === 'text'}
          />
        ) : (
          <MediaUpload
            id="desc_image"
            previewUrl={store.descImage}
            onMediaSelect={store.setDescImage}
            type="image"
            required={store.descType === 'image'}
          />
        )}
      </div>
    </div>
  ),

  () => (
    <div className="space-y-6">
      {/* Price Input */}
      <div className="space-y-1">
        <label htmlFor="price" className="block text-sm font-medium">
          {t('series.edit.price')}
        </label>
        <input
          id="price"
          type="number"
          value={store.price}
          onChange={(e) => store.setPrice(e.target.value)}
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
          value={store.duration}
          onChange={(e) => store.setDuration(e.target.value)}
          className="w-full p-2 border rounded bg-white"
          required
        >
          {store.durationOptions.map(({ key, value }) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>
    </div>
  ),

  () => {
    const courses = store.courses || [];

    const handleMoveCourse = (dragIndex, dropIndex) => {
      const [removed] = courses.splice(dragIndex, 1);
      courses.splice(dropIndex, 0, removed);
      store.setCourses(courses);
    };

    return (
      <div className="space-y-4">
        <Button
          onClick={() => store.openEditCourseDialog()}
          className="w-full"
        >
          {t('series.addChapter')}
        </Button>
        {courses.map((course, idx) => (
          <CourseCard
            key={course.id}
            course={course}
            isEditMode={true}
            onEdit={() => store.openEditCourseDialog(course)}
            index={idx}
            moveItem={handleMoveCourse}
          />
        ))}
      </div>
    );
  }
]

const EditSeriesPage = observer(({ step }) => steps[step - 1]())

const EditSeriesPage1 = observer(({ onClose, onSave }) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleComplete = async () => {
    try {
      await store.saveSeries();
      store.reset();
      onClose();
    } catch (error) {
      console.error('Failed to save series:', error);
    }
  };

  return (
    <>
          <Step1Content key="step1" />,
          <Step2Content key="step2" />,
          <Step3Content key="step3" />,
          <Step4Content key="step4" />,
          <Step5Content key="step5" />,
          <Step6Content key="step6" />

      {/* <Dialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          store.reset();
          onClose();
        }}
        title={t('common.confirm')}
        isConfirm={true}
      >
        <p>{t('common.closeWithoutSaving')}</p>
      </Dialog> */}
    </>
  );
});

// const EditCourseDialog = observer(() => (
//   <Dialog
//     isOpen={store.editCourseDialogOpen}
//     onClose={store.closeEditCourseDialog}
//     onConfirm={store.updateCourse}
//     title={editCourseStore.editingCourse ? t('course.editCourse') : t('course.addCourse')}
//     size="xl"
//     isConfirm={true}
//   >
//     <EditCoursePage
//       courseId={store.currentEditCourse?.id}
//       seriesId={store.editingSeries?.id}
//     />
//   </Dialog>
// ));

export default EditSeriesPage;