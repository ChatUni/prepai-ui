import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { SiWechat } from 'react-icons/si';
import store from '../../stores/paymentManagerStore';
import seriesStore from '../../stores/seriesStore';
import Dialog from './Dialog';
import FormInput from './FormInput';
import WeChatPayDialog from './WeChatPayDialog';
import { t } from '../../stores/languageStore';
import clientStore from '../../stores/clientStore';

const predefinedAmounts = [500, 1000, 5000, 10000];

const PaymentManager = observer(() => {
  const navigate = useNavigate();
  const series = store.currentSeries;

  const renderMembershipDialog = () => (
    <Dialog
      isOpen={store.showMembershipDialog}
      onClose={() => store.setField('showMembershipDialog', false)}
      onConfirm={() => store.handleMembershipPurchase(navigate)}
      title={t('assistant.membershipRequired.title')}
      isConfirm={true}
    >
      <p>{t('assistant.membershipRequired.message', { type: t(`order.types.${store.editingItem.memberType}`) })}</p>
    </Dialog>
  );

  const renderSeriesDialog = () => {
    if (!series) return null;
    
    return (
      <Dialog
        isOpen={store.showSeriesDialog}
        onClose={() => store.setShowSeriesDialog(false)}
        onConfirm={() => store.handleSeriesPurchase()}
        title={t('series.seriesPurchaseRequired.title')}
        isConfirm={true}
      >
        <div>
          <p className="mb-4">{t('series.seriesPurchaseRequired.message')}</p>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">{series.name}</h4>
            
            {/* Price Information */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-red-600">¥{series.price}</span>
                {series.originalPrice && series.originalPrice > series.price && (
                  <span className="text-sm text-gray-500 line-through">¥{series.originalPrice}</span>
                )}
              </div>
            </div>
            
            {/* Instructor Information */}
            {(() => {
              const instructors = seriesStore.getSeriesInstructors(series);
              return instructors.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {t('series.edit.instructor')}: {instructors.map(i => i.name).join(', ')}
                </p>
              );
            })()}
            
            <p className="text-sm text-gray-600 mt-1">
              {t('series.duration')}: {series.duration} {t('series.edit.days')}
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

  const renderTransactionDialog = () => (
    <Dialog
      isOpen={store.showRechargeDialog}
      onClose={() => store.cancelTransaction()}
      onConfirm={() => store.proceedWithTransaction()}
      title={t(`${store.transactionMode}.confirm_title`)}
      isConfirm={true}
    >
      <div>
        <p className="text-gray-600 mb-4">{t(`${store.transactionMode}.confirm_message`)}</p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ¥{store.rechargeAmount}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {t(`${store.transactionMode}.amount_to_${store.transactionMode}`)}
            </div>
          </div>
          {/* Show bank account info for withdraw */}
          {store.isWithdraw && store.bankAccount && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600 space-y-2">
                {store.userName && (
                  <div>
                    <span className="font-medium">{t('withdraw.user_name_label')}:</span>
                    <div className="mt-1 text-gray-800">
                      {store.userName}
                    </div>
                  </div>
                )}
                {store.bankName && (
                  <div>
                    <span className="font-medium">{t('withdraw.bank_name_label')}:</span>
                    <div className="mt-1 text-gray-800">
                      {store.bankName}
                    </div>
                  </div>
                )}
                <div>
                  <span className="font-medium">{t('withdraw.bank_account_label')}:</span>
                  <div className="mt-1 font-mono text-gray-800">
                    {store.bankAccount}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );

  const renderTransactionAmountDialog = () => (
    <Dialog
      isOpen={store.showRechargeAmountDialog}
      onClose={() => store.cancelTransaction()}
      onConfirm={() => store.confirmTransaction()}
      title={t(`${store.transactionMode}.amount_dialog_title`)}
      isConfirm={true}
    >
      <div className="mb-6">
        {/* Predefined Recharge Amount Cards */}
        {store.isRecharge && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('recharge.select_amount')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => store.setField('rechargeAmount', amount)}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    store.rechargeAmount === amount
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-lg font-semibold">¥{amount}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Amount Input */}
        <div className="pt-4">
          <FormInput
            label={t(`${store.transactionMode}.custom_amount`, { max: clientStore.balance })}
            type="number"
            store={store}
            field="rechargeAmount"
            placeholder={t(`${store.transactionMode}.amount_placeholder`)}
            min={1}
            max={store.isWithdraw ? clientStore.balance : null}
            step="0.01"
          />
        </div>

        {/* Bank Account Input for Withdraw Mode */}
        {store.isWithdraw && (
          <div className="pt-4 mt-4 space-y-4">
            <FormInput
              label={t('withdraw.user_name_label')}
              store={store}
              field="userName"
              placeholder={t('withdraw.user_name_placeholder')}
            />
            <FormInput
              label={t('withdraw.bank_name_label')}
              store={store}
              field="bankName"
              placeholder={t('withdraw.bank_name_placeholder')}
            />
            <FormInput
              label={t('withdraw.bank_account_label')}
              store={store}
              field="bankAccount"
              placeholder={t('withdraw.bank_account_placeholder')}
            />
          </div>
        )}
      </div>
    </Dialog>
  );

  return (
    <>
      {renderMembershipDialog()}
      {renderSeriesDialog()}
      {renderTransactionDialog()}
      {renderTransactionAmountDialog()}
      <WeChatPayDialog
        isOpen={store.showWeChatDialog}
        onClose={() => store.setShowWeChatDialog(false)}
        orderData={store.orderData}
        onPaymentSuccess={data => store.handlePaymentSuccess(data)}
        onPaymentError={error => store.handlePaymentError(error)}
      />
    </>
  );
});

export default PaymentManager;