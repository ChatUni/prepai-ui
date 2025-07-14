import { useState } from 'react';
import { t } from '../stores/languageStore';

const useDialogSteps = ({ store }) => {
  const [currentStep, setCurrentStep] = useState(6);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!store || (store.stepData || []).length === 0) return {};

  const step = store.stepData[currentStep - 1];

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
  };

  const clearStep = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleNext = async () => {
    if (!step.isValid(store.editingItem)) {
      setError(t(`${store.name}.edit.errors.${step.error}`));
      return;
    }
    
    if (store.isDirty && step.save) {
      try {
        setIsSaving(true);
        await step.save(store.editingItem);
      } catch (e) {
        setError(e);
        return;
      } finally {
        setIsSaving(false);
      }
    }

    setError('');
    if (currentStep === store.stepData.length) {
      onComplete?.();
    } else {
      nextStep();
    }
  };

  return {
    currentStep,
    error,
    isSaving,
    nextStep,
    prevStep,
    clearStep,
    handleNext
  };
};

export default useDialogSteps;