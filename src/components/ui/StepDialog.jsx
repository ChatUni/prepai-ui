import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import lang from '../../stores/languageStore';
import Button from './Button';
import useDialogSteps from '../../hooks/useDialogSteps';
import useDialogOverflow from '../../hooks/useDialogOverflow';

const StepDialog = observer(({
  isOpen,
  onClose,
  stepTitles = [],
  validateStep,
  onComplete,
  children
}) => {
  const totalSteps = stepTitles.length;

  const {
    currentStep,
    error,
    prevStep,
    handleNext
  } = useDialogSteps({
    totalSteps,
    validateStep,
    onComplete
  });

  useDialogOverflow(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="px-6 py-4">
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">
                  {stepTitles[currentStep - 1]}
                </h2>
                <div className="text-sm text-gray-500">
                  {lang.t('common.step')} {currentStep} {lang.t('common.of')} {totalSteps}
                </div>
              </div>
              <div className="flex-grow mb-6">
                {Array.isArray(children) ? children[currentStep - 1] : children}
                {error && (
                  <div className="mt-4 text-red-600 text-sm">{error}</div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <Button
                  onClick={onClose}
                  color="gray"
                >
                  {lang.t('common.cancel')}
                </Button>
                <div className="flex gap-4">
                  <Button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    {lang.t('common.previous')}
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === totalSteps && !onComplete}
                  >
                    {currentStep === totalSteps ? lang.t('common.save') : lang.t('common.next')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default StepDialog;