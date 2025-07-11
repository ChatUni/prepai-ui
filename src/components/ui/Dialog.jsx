import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import { t } from '../../stores/languageStore';
import useDialogOverflow from '../../hooks/useDialogOverflow';
import ConfirmButtons from './ConfirmButtons';
import useDialogSteps from '../../hooks/useDialogSteps';
import Button from './Button';

const Dialog = observer(({
  isOpen,
  onClose,
  onConfirm,
  onComplete,
  title,
  isConfirm = false,
  stepTitles = [],
  validateStep,
  renderChildren,
  children,
}) => {
  const totalSteps = stepTitles.length;
  const isSteps = totalSteps > 0;

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
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="px-6 py-4">
            {isSteps ? StepTitle(stepTitles, currentStep, totalSteps) : Title(title)}
            <div className="mb-6" />
            {renderChildren ? renderChildren(currentStep) : children}
            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}
          </div>
          {isSteps
            ? StepButtons(currentStep, totalSteps, prevStep, handleNext, onClose)
            : <ConfirmButtons
                isConfirm={isConfirm}
                isDialog={true}
                onClose={onClose}
                onConfirm={onConfirm}
              />
          }
        </div>
      </div>
    </div>,
    document.body
  );
});

const Title = (title) => title && (
  <h3 className="text-lg font-medium">{title}</h3>
)

const StepTitle = (stepTitles, currentStep, totalSteps) => (
  <>
    <h2 className="text-xl font-semibold">
      {stepTitles[currentStep - 1]}
    </h2>
    <div className="text-sm text-gray-500">
      {t('common.step')} {currentStep} {t('common.of')} {totalSteps}
    </div>
  </>
)

const StepButtons = (currentStep, totalSteps, prevStep, handleNext, onClose) => (
  <div className="flex justify-between items-center px-6 py-4">
    <Button
      onClick={onClose}
      color="gray"
    >
      {t('common.cancel')}
    </Button>
    <div className="flex gap-4">
      <Button
        onClick={prevStep}
        disabled={currentStep === 1}
      >
        {t('common.previous')}
      </Button>
      <Button
        onClick={handleNext}
      >
        {currentStep === totalSteps ? t('common.finish') : t('common.next')}
      </Button>
    </div>
  </div>
)

export default Dialog;