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
import FormRadio from '../../ui/FormRadio';
import ImageUpload from '../../ui/ImageUpload';

const steps = [
  () => <FormSelect store={store} field="group" options={clientStore.client.settings.seriesGroups} required />,

  () => (
    <div className="space-y-6">
      <FormInput store={store} field="name" required />
      <FormInput store={store} field="category" choices={store.uniqueCategories} required />
    </div>
  ),

  () => <ImageUpload store={store} field="image" required />,

  () => (
    <>
      <FormRadio store={store} field="descType"
        options={['text', 'image'].map(type => ({
          value: type,
          label: t(`series.descType${type[0].toUpperCase() + type.slice(1)}`)
        }))}
      />

      {store.descType === 'text'
        ? <FormInput store={store} field="desc" required />
        : <ImageUpload store={store} field="desc" required hasTitle={false} />
      }
    </>
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
].map(observer);

const EditSeriesPage = ({ step }) => {
  const Step = steps[step - 1];
  return <Step />;
}

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