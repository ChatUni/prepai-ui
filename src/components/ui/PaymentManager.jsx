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
      onClose={() => paymentManagerStore.setField('showMembershipDialog', false)}
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

  const renderTransactionDialog = () => {
    const isWithdraw = paymentManagerStore.transactionMode === 'withdraw';
    const modeKey = isWithdraw ? 'withdraw' : 'recharge';
    
    return (
      <Dialog
        isOpen={isRechargeDialogOpen}
        onClose={() => paymentManagerStore.cancelTransaction()}
        onConfirm={() => paymentManagerStore.proceedWithTransaction()}
        title={t(`${modeKey}.confirm_title`)}
        isConfirm={true}
      >
        <div>
          <p className="text-gray-600 mb-4">{t(`${modeKey}.confirm_message`)}</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ¥{paymentManagerStore.rechargeAmount}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t(`${modeKey}.amount_to_${isWithdraw ? 'withdraw' : 'recharge'}`)}
              </div>
            </div>
            {/* Show bank account info for withdraw */}
            {isWithdraw && paymentManagerStore.bankAccount && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t('withdraw.bank_account_label')}:</span>
                  <div className="mt-1 font-mono text-gray-800">
                    {paymentManagerStore.bankAccount}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    );
  };

  const renderTransactionAmountDialog = () => {
    const predefinedAmounts = [500, 1000, 5000, 10000];
    const isWithdraw = paymentManagerStore.transactionMode === 'withdraw';
    const modeKey = isWithdraw ? 'withdraw' : 'recharge';
    
    return (
      <Dialog
        isOpen={isRechargeAmountDialogOpen}
        onClose={() => paymentManagerStore.cancelTransaction()}
        onConfirm={() => paymentManagerStore.confirmTransaction()}
        title={t(`${modeKey}.amount_dialog_title`)}
        isConfirm={true}
      >
        <div className="mb-6">
          {/* Predefined Amount Cards */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t(`${modeKey}.select_amount`)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => paymentManagerStore.setField('rechargeAmount', amount)}
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
          <div className="pt-4">
            <FormInput
              label={t(`${modeKey}.custom_amount`)}
              type="number"
              value={paymentManagerStore.rechargeAmount}
              onChange={(value) => paymentManagerStore.setField('rechargeAmount', value)}
              placeholder={t(`${modeKey}.amount_placeholder`)}
              min={1}
              step="0.01"
            />
          </div>

          {/* Bank Account Input for Withdraw Mode */}
          {isWithdraw && (
            <div className="pt-4 mt-4 space-y-4">
              <FormInput
                label={t('withdraw.user_name_label')}
                type="text"
                value={paymentManagerStore.userName}
                onChange={(value) => paymentManagerStore.setField('userName', value)}
                placeholder={t('withdraw.user_name_placeholder')}
              />
              <FormInput
                label={t('withdraw.bank_name_label')}
                type="text"
                value={paymentManagerStore.bankName}
                onChange={(value) => paymentManagerStore.setField('bankName', value)}
                placeholder={t('withdraw.bank_name_placeholder')}
              />
              <FormInput
                label={t('withdraw.bank_account_label')}
                store={paymentManagerStore}
                field="bankAccount"
                placeholder={t('withdraw.bank_account_placeholder')}
              />
            </div>
          )}
        </div>
      </Dialog>
    );
  };

  return (
    <>
      {renderMembershipDialog()}
      {renderSeriesDialog()}
      {renderTransactionDialog()}
      {renderTransactionAmountDialog()}
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