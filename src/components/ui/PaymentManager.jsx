import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { SiWechat } from 'react-icons/si';
import paymentManagerStore from '../../stores/paymentManagerStore';
import seriesStore from '../../stores/seriesStore';
import Dialog from './Dialog';
import FormInput from './FormInput';
import WeChatPayDialog from './WeChatPayDialog';
import { t } from '../../stores/languageStore';

const PaymentManager = observer(() => {
  const navigate = useNavigate();
  const isMembershipDialogOpen = paymentManagerStore.showMembershipDialog;
  const isSeriesDialogOpen = paymentManagerStore.showSeriesDialog;
  const isRechargeDialogOpen = paymentManagerStore.showRechargeDialog;
  const isRechargeAmountDialogOpen = paymentManagerStore.showRechargeAmountDialog;
  const isWeChatDialogOpen = paymentManagerStore.showWeChatDialog;
  const currentSeries = paymentManagerStore.currentSeries;
  const orderData = paymentManagerStore.orderData;

  const renderMembershipDialog = () => (
    <Dialog
      isOpen={isMembershipDialogOpen}
      onClose={() => paymentManagerStore.setShowMembershipDialog(false)}
      onConfirm={() => paymentManagerStore.handleMembershipPurchase(navigate)}
      title={t('assistant.membershipRequired.title')}
      isConfirm={true}
    >
      <p>{t('assistant.membershipRequired.message')}</p>
    </Dialog>
  );

  const renderSeriesDialog = () => {
    if (!currentSeries) return null;
    
    return (
      <Dialog
        isOpen={isSeriesDialogOpen}
        onClose={() => paymentManagerStore.setShowSeriesDialog(false)}
        onConfirm={() => paymentManagerStore.handleSeriesPurchase()}
        title={t('series.seriesPurchaseRequired.title')}
        isConfirm={true}
      >
        <div>
          <p className="mb-4">{t('series.seriesPurchaseRequired.message')}</p>
          <div className="p-4 bg-gray-50 rounded-lg">
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
              {t('series.duration')}: {currentSeries.duration} {t('series.edit.days')}
            </p>
          </div>
          
          {/* WeChat Pay Icon */}
          <div className="flex items-center text-green-500 mt-4">
            <SiWechat className="text-2xl" />
            <span className="ml-2 text-sm text-gray-600">{t('payment.wechat_pay')}</span>
          </div>
        </div>
      </Dialog>
    );
  };

  const renderRechargeDialog = () => (
    <Dialog
      isOpen={isRechargeDialogOpen}
      onClose={() => paymentManagerStore.cancelRecharge()}
      onConfirm={() => paymentManagerStore.proceedWithRecharge()}
      title={t('recharge.confirm_title')}
      isConfirm={true}
    >
      <div>
        <p className="text-gray-600 mb-4">{t('recharge.confirm_message')}</p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ¥{paymentManagerStore.rechargeAmount}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {t('recharge.amount_to_recharge')}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );

  const renderRechargeAmountDialog = () => {
    const predefinedAmounts = [100, 500, 1000, 5000];
    
    return (
      <Dialog
        isOpen={isRechargeAmountDialogOpen}
        onClose={() => paymentManagerStore.cancelRecharge()}
        onConfirm={() => paymentManagerStore.confirmRecharge()}
        title={t('recharge.amount_dialog_title')}
        isConfirm={true}
      >
        <div className="mb-6">
          {/* Predefined Amount Cards */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('recharge.select_amount')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => paymentManagerStore.setRechargeAmount(amount)}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    paymentManagerStore.rechargeAmount === amount
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-lg font-semibold">¥{amount}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="border-t pt-4">
            <FormInput
              label={t('recharge.custom_amount')}
              type="number"
              value={paymentManagerStore.rechargeAmount}
              onChange={(value) => paymentManagerStore.setRechargeAmount(value)}
              placeholder={t('recharge.amount_placeholder')}
              min={1}
              step="0.01"
            />
          </div>
        </div>
      </Dialog>
    );
  };

  return (
    <>
      {renderMembershipDialog()}
      {renderSeriesDialog()}
      {renderRechargeDialog()}
      {renderRechargeAmountDialog()}
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