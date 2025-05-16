import { observer } from 'mobx-react-lite';
import languageStore from '../../stores/languageStore';
import Button from './Button';

const StepsContainer = observer(({ 
  currentStep, 
  totalSteps, 
  stepTitles, 
  onNext, 
  onPrev, 
  children 
}) => {
  const { t } = languageStore;

  return (
    <div className="flex flex-col h-full">
      {/* Step Title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          {stepTitles[currentStep - 1]}
        </h2>
        <div className="text-sm text-gray-500">
          {t('common.step')} {currentStep} {t('common.of')} {totalSteps}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-grow">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4 pt-4">
        <Button
          onClick={onPrev}
          disabled={currentStep === 1}
        >
          {t('common.previous')}
        </Button>
        <Button
          onClick={onNext}
          disabled={currentStep === totalSteps}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
});

export default StepsContainer;