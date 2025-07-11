import { useState } from 'react';

const useDialogSteps = ({ totalSteps, validateStep, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  if (!totalSteps) return {};

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
  };

  const clearError = () => {
    setError('');
  };

  const handleNext = async () => {
    if (validateStep) {
      const validationError = await validateStep(currentStep);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    
    clearError();
    if (currentStep === totalSteps) {
      onComplete?.();
    } else {
      nextStep();
    }
  };

  return {
    currentStep,
    error,
    nextStep,
    prevStep,
    setError,
    clearError,
    handleNext
  };
};

export default useDialogSteps;