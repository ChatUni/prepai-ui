import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { SiWechat } from 'react-icons/si';
import useDialogOverflow from '../../hooks/useDialogOverflow';
import paymentManagerStore from '../../stores/paymentManagerStore';
import seriesStore from '../../stores/seriesStore';
import WeChatPayDialog from './WeChatPayDialog';
import { t } from '../../stores/languageStore';

const PaymentManager = observer(() => {
  const navigate = useNavigate();
  const isMembershipDialogOpen = paymentManagerStore.showMembershipDialog;
  const isSeriesDialogOpen = paymentManagerStore.showSeriesDialog;
  const isWeChatDialogOpen = paymentManagerStore.showWeChatDialog;
  const currentSeries = paymentManagerStore.currentSeries;
  const orderData = paymentManagerStore.orderData;

  useDialogOverflow(isMembershipDialogOpen || isSeriesDialogOpen);

  const renderMembershipDialog = () => {
    if (!isMembershipDialogOpen) return null;

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
  };

  const renderSeriesDialog = () => {
    if (!isSeriesDialogOpen || !currentSeries) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => paymentManagerStore.setShowSeriesDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium">{t('series.seriesPurchaseRequired.title')}</h3>
            </div>
            <div className="px-6 py-4">
              <p>{t('series.seriesPurchaseRequired.message')}</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{currentSeries.name}</h4>
                
                {/* Price Information */}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-red-600">¥{currentSeries.price}</span>
                    {currentSeries.originalPrice && currentSeries.originalPrice > currentSeries.price && (
                      <span className="text-sm text-gray-500 line-through">¥{currentSeries.originalPrice}</span>
                    )}
                  </div>
                </div>
                
                {/* Instructor Information */}
                {(() => {
                  const instructors = seriesStore.getSeriesInstructors(currentSeries);
                  return instructors.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {t('series.edit.instructor')}: {instructors.map(i => i.name).join(', ')}
                    </p>
                  );
                })()}
                
                <p className="text-sm text-gray-600 mt-1">
                  {t('series.duration')}: {currentSeries.duration?.replace('days', ' Days') || 'N/A'}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              {/* WeChat Pay Icon */}
              <div className="flex items-center text-green-500">
                <SiWechat className="text-2xl" />
                <span className="ml-2 text-sm text-gray-600">{t('payment.wechat_pay')}</span>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => paymentManagerStore.setShowSeriesDialog(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('series.seriesPurchaseRequired.cancel')}
                </button>
                <button
                  onClick={() => paymentManagerStore.handleSeriesPurchase()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('series.seriesPurchaseRequired.purchase')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      {renderMembershipDialog()}
      {renderSeriesDialog()}
      <WeChatPayDialog
        isOpen={isWeChatDialogOpen}
        onClose={() => paymentManagerStore.setShowWeChatDialog(false)}
        orderData={orderData}
        onPaymentSuccess={paymentManagerStore.handlePaymentSuccess}
        onPaymentError={paymentManagerStore.handlePaymentError}
      />
    </>
  );
});

export default PaymentManager;