import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { t } from '../../stores/languageStore';
import useDialogOverflow from '../../hooks/useDialogOverflow';
import ConfirmButtons from './ConfirmButtons';
import useDialogSteps from '../../hooks/useDialogSteps';
import Button from './Button';

const Dialog = observer(({
  store,
  isOpen,
  onClose,
  onConfirm,
  title,
  isConfirm = false,
  renderChildren,
  children,
}) => {
  const stepData = store?.stepData || [];
  const totalSteps = stepData.length;
  const isSteps = totalSteps > 0;

  const {
    currentStep,
    error,
    isSaving,
    prevStep,
    handleNext,
    clearStep
  } = useDialogSteps({ store });

  useDialogOverflow(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={isSteps ? null : onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 px-6 pb-4">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {isSteps ? StepTitle(store, currentStep, totalSteps) : Title(title)}
              </div>
              {isSaving && (
                <AiOutlineLoading3Quarters className="animate-spin text-blue-500 ml-4" size={20} />
              )}
            </div>
            <div className="mb-6" />
            {renderChildren ? renderChildren(currentStep) : children}
            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}
          </div>
          {isSteps
            ? StepButtons(store, currentStep, totalSteps, prevStep, handleNext, onClose, clearStep, isSaving)
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

const StepTitle = (store, currentStep, totalSteps) => (
  <>
    <h2 className="text-xl font-semibold">
      {t(`${store.name}.edit.steps.${store.stepData[currentStep - 1].title}`)}
    </h2>
    <div className="text-sm text-gray-500">
      {t('common.step')} {currentStep} {t('common.of')} {totalSteps}
    </div>
  </>
)

const StepButtons = (store, currentStep, totalSteps, prevStep, handleNext, onClose, clearStep, isSaving) => (
  <div className="flex justify-between items-center">
    <Button
      onClick={() => {
        clearStep();
        onClose();
      }}
      color="gray"
      disabled={isSaving}
    >
      {t('common.cancel')}
    </Button>
    <div className="flex gap-4">
      <Button
        onClick={prevStep}
        disabled={isSaving || currentStep === 1}
      >
        {t('common.previous')}
      </Button>
      <Button
        onClick={handleNext}
        disabled={isSaving}
      >
        {currentStep === totalSteps
          ? t('common.finish')
          : (store.stepData[currentStep - 1].save && store.isDirty
            ? t('common.saveAndNext')
            : t('common.next'))
        }
      </Button>
    </div>
  </div>
)

export default Dialog;