import { observer } from 'mobx-react-lite';
import lang from '../../stores/languageStore';

const ConfirmButtons = observer(({
  isConfirm = false,
  onClose,
  onConfirm,
  className = "px-6 py-4 flex justify-end gap-4"
}) => (
  <div className={className}>
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
));

export default ConfirmButtons;