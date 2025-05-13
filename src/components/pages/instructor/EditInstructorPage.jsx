import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import instructorsStore from '../../../stores/instructorsStore';
import editInstructorStore from '../../../stores/editInstructorStore';
import languageStore from '../../../stores/languageStore';
import ImageUpload from '../../ui/ImageUpload';

const EditInstructorPage = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const instructor = instructorsStore.getInstructor(id);
    editInstructorStore.reset(instructor);
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await editInstructorStore.saveInstructor(formData);
      navigate('/instructors');
    } catch (error) {
      console.error('Failed to save instructor:', error);
    }
  };

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {editInstructorStore.editingInstructor ? t('instructors.edit.title') : t('instructors.add.title')}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mb-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={editInstructorStore.isLoading}
              className={`px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                editInstructorStore.isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {editInstructorStore.isLoading
                ? (editInstructorStore.editingInstructor ? t('instructors.edit.saving') : t('instructors.add.creating'))
                : (editInstructorStore.editingInstructor ? t('instructors.edit.save') : t('instructors.add.create'))
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EditInstructorPage;