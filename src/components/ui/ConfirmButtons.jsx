import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { t } from '../../stores/languageStore';
import uiStore from '../../stores/uiStore';

const ConfirmButtons = observer(({
  isConfirm = false,
  isDialog = false,
  onClose,
  onConfirm,
  className = "py-2 flex justify-end gap-4"
}) => {
  const navigate = useNavigate();

  const handleClick = (handler) => async () => {
    uiStore.setConfirmButtonsLoading(true);
    try {
      if (handler) {
        await handler();
      } else if (!isDialog) {
        navigate(-1);
      }
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleClick(onConfirm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('common.confirm')}
              </button>
            </>
          ) : (
            <button
              onClick={handleClick(onClose)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.ok')}
            </button>
          )}
        </>
      )}
    </div>
  );
});

export default ConfirmButtons;