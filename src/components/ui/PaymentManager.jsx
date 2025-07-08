import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import useDialogOverflow from '../../hooks/useDialogOverflow';
import paymentManagerStore from '../../stores/paymentManagerStore';
import { t } from '../../stores/languageStore';

const PaymentManager = observer(() => {
  const navigate = useNavigate();
  const isOpen = paymentManagerStore.showMembershipDialog;

  useDialogOverflow(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={() => paymentManagerStore.setShowMembershipDialog(false)} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium">{t('assistant.membershipRequired.title')}</h3>
          </div>
          <div className="px-6 py-4">
            <p>{t('assistant.membershipRequired.message')}</p>
          </div>
          <div className="px-6 py-4 flex justify-end gap-4">
            <button
              onClick={() => paymentManagerStore.setShowMembershipDialog(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('assistant.membershipRequired.cancel')}
            </button>
            <button
              onClick={() => paymentManagerStore.handleMembershipPurchase(navigate)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('assistant.membershipRequired.purchase')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default PaymentManager;