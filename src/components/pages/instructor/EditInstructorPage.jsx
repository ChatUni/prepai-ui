import { observer } from 'mobx-react-lite';
import editInstructorStore from '../../../stores/editInstructorStore';
import languageStore from '../../../stores/languageStore';
import ImageUpload from '../../ui/ImageUpload';

const EditInstructorPage = observer(() => {
  const { t } = languageStore;

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
        <form className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('instructors.edit.name')}
            </label>
            <input
              id="name"
              type="text"
              value={editInstructorStore.name}
              onChange={(e) => editInstructorStore.setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              {t('instructors.edit.titleField')}
            </label>
            <input
              id="title"
              type="text"
              value={editInstructorStore.title}
              onChange={(e) => editInstructorStore.setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Bio Input */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              {t('instructors.edit.bio')}
            </label>
            <textarea
              id="bio"
              rows={5}
              value={editInstructorStore.bio}
              onChange={(e) => editInstructorStore.setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Expertise Input */}
          <div>
            <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 mb-1">
              {t('instructors.edit.expertise')}
            </label>
            <textarea
              id="expertise"
              rows={3}
              value={editInstructorStore.expertise}
              onChange={(e) => editInstructorStore.setExpertise(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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