import React from 'react';
import { observer } from 'mobx-react-lite';
import seriesStore from '../../../stores/seriesStore';
import editCourseStore from '../../../stores/editCourseStore';
import editInstructorStore from '../../../stores/editInstructorStore';
import languageStore from '../../../stores/languageStore';
import MediaUpload from '../../ui/MediaUpload';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import EditInstructorPage from '../instructor/EditInstructorPage';

const EditCoursePage = observer(() => {
  const { t } = languageStore;

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-lg">
        <form className="space-y-6">
          {/* Instructor Selection */}
          <FormSelect
            id="instructor"
            label={t('course.add.instructor')}
            value={editCourseStore.instructor_id || ''}
            onChange={(e) => editCourseStore.setInstructorId(parseInt(e.target.value))}
            options={seriesStore.instructors.map(instructor => ({
              value: instructor.id,
              label: instructor.name
            }))}
            placeholder={t('course.add.selectInstructor')}
            required
            canAdd={true}
            onAdd={async () => {
              const formData = new FormData();
              const savedInstructor = await editInstructorStore.saveInstructor(formData);
              await seriesStore.fetchSeries();
              return {
                value: savedInstructor.id,
                label: savedInstructor.name
              };
            }}
            addDialogPage={() => {
              editInstructorStore.reset();
              return (
                <div className="max-h-[80vh] overflow-y-auto">
                  <EditInstructorPage />
                </div>
              );
            }}
            addDialogTitle={t('instructors.add.title')}
          />

          {/* Course Title */}
          <FormInput
            id="title"
            label={t('course.add.courseName')}
            value={editCourseStore.title}
            onChange={(e) => editCourseStore.setTitle(e.target.value)}
            required
          />

          {/* Course Duration */}
          <FormInput
            id="duration"
            type="number"
            label={t('course.add.duration')}
            value={editCourseStore.duration}
            onChange={(e) => editCourseStore.setDuration(parseInt(e.target.value))}
            min="0"
            required
          />

          {/* <MediaUpload
            id="cover-upload"
            type="image"
            label={t('course.add.image')}
            previewUrl={editCourseStore.imagePreview}
            onMediaSelect={(file) => editCourseStore.setImage(file)}
            className="space-y-2"
          /> */}

          <MediaUpload
            id="video-upload"
            type="video"
            label={t('course.add.courseVideo')}
            previewUrl={editCourseStore.url}
            onMediaSelect={editCourseStore.setUrl}
            className="space-y-2"
            required
          />

          {/* Error Message */}
          {editCourseStore.error && (
            <div className="text-red-600 text-sm">{editCourseStore.error}</div>
          )}
        </form>
      </div>
    </div>
  );
});

export default EditCoursePage;