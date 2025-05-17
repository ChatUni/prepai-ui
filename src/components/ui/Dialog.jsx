import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import lang from '../../stores/languageStore';
import Button from './Button';

const Dialog = observer(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  children, 
  isConfirm = false,
  isSteps = false,
  currentStep = 1,
  totalSteps = 1,
  stepTitles = [],
  onNext,
  onPrev
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const StepsDialog = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
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
                {children}
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={onPrev}
                  disabled={currentStep === 1}
                >
                  {lang.t('common.previous')}
                </Button>
                <Button
                  onClick={onNext}
                  disabled={currentStep === totalSteps}
                >
                  {lang.t('common.next')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const RegularDialog = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          {title && (
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium">{title}</h3>
            </div>
          )}
          <div className="px-6 py-4">
            {children}
          </div>
          <div className="px-6 py-4 flex justify-end gap-4">
            {isConfirm ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {lang.t('common.cancel')}
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {lang.t('common.confirm')}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {lang.t('common.ok')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    isSteps ? StepsDialog : RegularDialog,
    document.body
  );
});

export default Dialog;