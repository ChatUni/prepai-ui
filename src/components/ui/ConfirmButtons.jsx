import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import lang from '../../stores/languageStore';
import uiStore from '../../stores/uiStore';

const ConfirmButtons = observer(({
  isConfirm = false,
  isDialog = false,
  onClose,
  onConfirm,
  className = "px-6 py-4 flex justify-end gap-4"
}) => {
  const navigate = useNavigate();

  const handleClick = (handler) => async () => {
    uiStore.setConfirmButtonsLoading(true);
    try {
      handler && await handler();
      !isDialog && navigate(-1);
    } finally {
      uiStore.setConfirmButtonsLoading(false);
    }
  };

  return (
    <div className={className}>
      {uiStore.isConfirmButtonsLoading ? (
        <div className="flex justify-center items-center">
          <AiOutlineLoading3Quarters className="animate-spin text-2xl text-blue-600" />
        </div>
      ) : (
        <>
          {isConfirm ? (
            <>
              <button
                onClick={handleClick(onClose)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {lang.t('common.cancel')}
              </button>
              <button
                onClick={handleClick(onConfirm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {lang.t('common.confirm')}
              </button>
            </>
          ) : (
            <button
              onClick={handleClick(onClose)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {lang.t('common.ok')}
            </button>
          )}
        </>
      )}
    </div>
  );
});

export default ConfirmButtons;