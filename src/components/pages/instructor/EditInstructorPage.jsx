import { observer } from 'mobx-react-lite';
import editInstructorStore from '../../../stores/editInstructorStore';
import languageStore from '../../../stores/languageStore';
import ImageUpload from '../../ui/ImageUpload';
import FormInput from '../../ui/FormInput';

const EditInstructorPage = observer(() => {
  const { t } = languageStore;

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
        <form className="space-y-6">
          {/* Name Input */}
          <FormInput
            id="name"
            label={t('instructors.edit.name')}
            value={editInstructorStore.name}
            onChange={(e) => editInstructorStore.setName(e.target.value)}
            required
          />

          {/* Title Input */}
          <FormInput
            id="title"
            label={t('instructors.edit.titleField')}
            value={editInstructorStore.title}
            onChange={(e) => editInstructorStore.setTitle(e.target.value)}
            required
          />

          {/* Bio Input */}
          <FormInput
            id="bio"
            label={t('instructors.edit.bio')}
            value={editInstructorStore.bio}
            onChange={(e) => editInstructorStore.setBio(e.target.value)}
            rows={5}
            required
          />

          {/* Expertise Input */}
          <FormInput
            id="expertise"
            label={t('instructors.edit.expertise')}
            value={editInstructorStore.expertise}
            onChange={(e) => editInstructorStore.setExpertise(e.target.value)}
            rows={3}
            required
          />

          <ImageUpload
            id="icon"
            label={t('instructors.edit.icon')}
            previewUrl={editInstructorStore.selectedImagePreview || editInstructorStore.image}
            onImageSelect={(file) => editInstructorStore.setSelectedImagePreview(file)}
            buttonText={editInstructorStore.image ? t('instructors.edit.changeImage') : t('instructors.edit.selectImage')}
            selectedText={editInstructorStore.image ? t('instructors.edit.fileSelected') : null}
            imageStyle="round"
          />

          {/* Error message */}
          {editInstructorStore.error && (
            <div className="text-red-600 text-sm">{editInstructorStore.error}</div>
          )}

        </form>
      </div>
    </div>
  );
});

export default EditInstructorPage;