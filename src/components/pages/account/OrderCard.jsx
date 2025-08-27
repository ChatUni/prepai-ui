import { observer } from 'mobx-react-lite';
import { FiCopy } from 'react-icons/fi';
import { t } from '../../../stores/languageStore';
import orderStore from '../../../stores/orderStore';
import clientStore from '../../../stores/clientStore';

const OrderCard = observer(({ order }) => {
  const handleCopyUserId = () => {
    navigator.clipboard.writeText(order.user_id);
  };

  const formatAmount = (amount) => {
    const value = parseFloat(amount || 0);
    return value >= 0 ? `+¥${value.toFixed(2)}` : `¥${value.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
      {/* Header with order type and amount */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`${orderStore.getOrderTypeColor(order.type)} text-white px-2 py-1 rounded text-xs font-medium`}>
            {orderStore.getOrderTypeLabel(order.type)}
          </span>
          <span className="text-gray-900 font-medium">
            {order.title || orderStore.getOrderTypeLabel(order.type)}
          </span>
        </div>
        <div className="text-right">
          <div className="text-green-600 font-bold text-lg">
            {formatAmount(order.amount)}
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

        {/* Additional order details */}
        <div className="border-t border-gray-200 pt-2 mt-3">
          {order.type === 'membership' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('order.systemCost')}:</span>
              <span className="text-red-600">-¥{orderStore.formatPrice(order.systemCost)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{t('order.netIncome')}:</span>
            <span className="text-green-600">
              +¥{orderStore.formatPrice(order.net)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{t('order.accountBalance')}:</span>
            <span className="text-gray-900">¥{orderStore.formatPrice(order.bal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OrderCard;