import { observer } from 'mobx-react-lite';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { t } from '../../../stores/languageStore';
import orderStore from '../../../stores/orderStore';
import clientStore from '../../../stores/clientStore';
import userStore from '../../../stores/userStore';
import { save } from '../../../utils/db';

const OrderCard = observer(({ order }) => (
  <div className={`rounded-lg p-4 mb-3 shadow-sm border ${
    orderStore.isPendingWithdraw(order)
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-white border-gray-200'
  }`}>
    {/* Header with order type and amount */}
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <span className={`${orderStore.getOrderTypeColor(order.type)} text-white px-2 py-1 rounded text-xs font-medium`}>
          {t(`order.types.${order.type}`)}
        </span>
        {orderStore.isPendingWithdraw(order) && (
          <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
            {t('membership.pending')}
          </span>
        )}
        {orderStore.isPaidWithdraw(order) && (
          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
            {t('membership.paid')}
          </span>
        )}
        <span className="text-gray-900 font-medium">
          {order.title}
        </span>
      </div>
      <div className="text-right">
        <div className={`font-bold text-lg ${
          orderStore.isPendingWithdraw(order) ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {orderStore.formatPrice(order.amount)}
        </div>
        <div className="text-gray-500 text-sm">
          {orderStore.formatOrderDate(order.paidAt)}
        </div>
      </div>
    </div>

    {/* User information */}
    <div className="space-y-2 text-sm">
      <div className="flex">
        <span className="text-gray-600 pr-2">{t('order.userId')}:</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-900">{order.user_id}</span>
          {/* <button
            onClick={handleCopyUserId}
            className="text-gray-500 hover:text-gray-700 transition-colors p-0"
            style={{ minHeight: '0 !important', height: 'auto !important' }}
            title={t('order.copyUserId')}
          >
            <FiCopy size={14} />
          </button> */}
        </div>
      </div>
      
      {order.user && (
        <div className="flex">
          <span className="text-gray-600 pr-2">{t('order.user')}:</span>
          <span className="text-gray-900">{order.user.name}</span>
        </div>
      )}

      {orderStore.isWithdraw(order) && (
        <div className="border-t border-gray-200 pt-2 mt-3">
          {order.userName && (
            <div className="flex">
              <span className="text-gray-600 pr-2">{t('withdraw.user_name_label')}:</span>
              <span className="text-gray-900">{order.userName}</span>
            </div>
          )}
          {order.bankName && (
            <div className="flex">
              <span className="text-gray-600 pr-2">{t('withdraw.bank_name_label')}:</span>
              <span className="text-gray-900">{order.bankName}</span>
            </div>
          )}
          {order.bankAccount && (
            <div className="flex">
              <span className="text-gray-600 pr-2">{t('withdraw.bank_account_label')}:</span>
              <span className="text-gray-900">{order.bankAccount}</span>
            </div>
          )}
          
          {/* Complete transaction button for super admin */}
          {userStore.isSuperAdmin && orderStore.isPendingWithdraw(order) && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => orderStore.openConfirmCompleteWithdrawDialog(order)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <FiCheck size={14} />
                {t('order.completeWithdraw')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Additional order details */}
      <div className="border-t border-gray-200 pt-2 mt-3">
        {orderStore.hasSystemCost(order) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('order.systemCost')}:</span>
            <span className="text-red-600">{orderStore.formatPrice(order.systemCost)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">{t('order.netIncome')}:</span>
          <span className={order.net < 0 ? "text-red-600" : "text-green-600"}>
            {orderStore.formatPrice(order.net)}
          </span>
        </div>
        
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">{t('order.accountBalance')}:</span>
          <span className="text-gray-900">{orderStore.formatPrice(order.balance)}</span>
        </div>
      </div>
    </div>
  </div>
));

export default OrderCard;