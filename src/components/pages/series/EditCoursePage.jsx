import React from 'react';
import { observer } from 'mobx-react-lite';
import seriesStore from '../../../stores/seriesStore';
import store from '../../../stores/courseStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import ImageUpload from '../../ui/ImageUpload';

const EditCoursePage = observer(() => (
  <div className="space-y-4">
    <FormSelect store={store} field="instructor_id" options={seriesStore.allInstructors} required />
    <FormInput store={store} field="title" required />
    <FormInput store={store} field="duration" required />
    <ImageUpload store={store} field="url" />
  </div>
));

export default EditCoursePage;

          // {/* Instructor Selection */}
          // <FormSelect
          //   id="instructor"
          //   label={t('course.add.instructor')}
          //   value={editCourseStore.instructor_id || ''}
          //   onChange={(e) => editCourseStore.setInstructorId(parseInt(e.target.value))}
          //   options={seriesStore.instructors.map(instructor => ({
          //     value: instructor.id,
          //     label: instructor.name
          //   }))}
          //   placeholder={t('course.add.selectInstructor')}
          //   required
          //   canAdd={true}
          //   onAdd={async () => {
          //     const formData = new FormData();
          //     const savedInstructor = await editInstructorStore.saveInstructor(formData);
          //     await seriesStore.fetchInstructors();
          //     return {
          //       value: savedInstructor.id,
          //       label: savedInstructor.name
          //     };
          //   }}
          //   addDialogPage={() => {
          //     editInstructorStore.reset();
          //     return (
          //       <div className="max-h-[80vh] overflow-y-auto">
          //         <EditInstructorPage />
          //       </div>
          //     );
          //   }}
          //   addDialogTitle={t('instructors.add.title')}
          // />

          // {/* Course Title */}
          // <FormInput
          //   id="title"
          //   label={t('course.add.courseName')}
          //   value={editCourseStore.title}
          //   onChange={(e) => editCourseStore.setTitle(e.target.value)}
          //   required
          // />

          // {/* Course Duration */}
          // <FormInput
          //   id="duration"
          //   type="number"
          //   label={t('course.add.duration')}
          //   value={editCourseStore.duration}
          //   onChange={(e) => editCourseStore.setDuration(parseInt(e.target.value))}
          //   min="0"
          //   required
          // />

          // {/* <MediaUpload
          //   id="cover-upload"
          //   type="image"
          //   label={t('course.add.image')}
          //   previewUrl={editCourseStore.imagePreview}
          //   onMediaSelect={(url) => editCourseStore.setImage(url)}
          //   className="space-y-2"
          // /> */}

          // <MediaUpload
          //   id="video-upload"
          //   type="video"
          //   label={t('course.add.courseVideo')}
          //   previewUrl={editCourseStore.url}
          //   onMediaSelect={editCourseStore.setUrl}
          //   className="space-y-2"
          //   required
          // />
