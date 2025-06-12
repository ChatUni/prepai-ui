import React from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../../stores/languageStore';
import assistantsStore from '../../../stores/assistantsStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import ImageUpload from '../../ui/ImageUpload';

const EditAssistantPage = observer(() => {
  const { t } = languageStore;

  const handleNameChange = (e) => {
    assistantsStore.setEditingAssistantName(e.target.value);
  };

  const handleGreetingChange = (e) => {
    assistantsStore.setEditingAssistantGreeting(e.target.value);
  };

  const handlePromptChange = (e) => {
    assistantsStore.setEditingAssistantPrompt(e.target.value);
  };

  const handleModelChange = (e) => {
    assistantsStore.setEditingAssistantModel(e.target.value);
  };

  const handleGroupChange = (e) => {
    assistantsStore.setEditingAssistantGroup(e.target.value);
  };

  const handleImageChange = (imageUrl) => {
    assistantsStore.setEditingAssistantImage(imageUrl);
  };

  const modelOptions = assistantsStore.models.map(model => ({
    value: model.id,
    label: model.name
  }));

  return (
    <div className="space-y-4">
      {/* Name Input */}
      <FormInput
        id="assistantName"
        label={t('assistants.name')}
        value={assistantsStore.editingAssistant.name || ''}
        onChange={handleNameChange}
        required
      />

      {/* Greeting Input */}
      <FormInput
        id="assistantGreeting"
        label={t('assistants.greeting')}
        value={assistantsStore.editingAssistant.greeting || ''}
        onChange={handleGreetingChange}
        rows={2}
      />

      {/* Prompt Input */}
      <FormInput
        id="assistantPrompt"
        label={t('assistants.prompt')}
        value={assistantsStore.editingAssistant.prompt || ''}
        onChange={handlePromptChange}
        rows={4}
        required
      />

      {/* Model and Group in same row */}
      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          id="assistantModel"
          label={t('assistants.model')}
          value={assistantsStore.editingAssistant.model || ''}
          onChange={handleModelChange}
          options={modelOptions}
          placeholder={t('assistants.selectModel')}
          required
        />
        <FormInput
          id="assistantGroup"
          label={t('assistants.group')}
          value={assistantsStore.editingAssistant.group || ''}
          onChange={handleGroupChange}
          placeholder="Default"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('assistants.image')}
        </label>
        <ImageUpload
          currentImage={assistantsStore.editingAssistant.image}
          onImageChange={handleImageChange}
          uploadPath={`assistants/${assistantsStore.editingAssistant.id || 'new'}`}
        />
      </div>
    </div>
  );
});

export default EditAssistantPage;