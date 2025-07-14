import { observer } from 'mobx-react-lite';
import { t } from '../../../stores/languageStore';
import store from '../../../stores/membershipStore';
import MembershipCard from './MembershipCard';
import ListPage from '../../ui/ListPage';
import EditMembershipPage from './EditMembershipPage';
import WeChatPayDialog from '../../ui/WeChatPayDialog';
import { SiWechat } from 'react-icons/si';

const MembershipListPage = observer(() => {

  const renderMembershipCard = (membership, index, group, { moveItem, isEditMode }, isFirstCard) => (
    <MembershipCard
      key={membership.id || index}
      membership={membership}
      index={index}
      moveItem={moveItem}
      isEditMode={isEditMode}
      renderDialogs={isFirstCard}
      isDraggable={true}
      onClick={(membership) => {
        if (!isEditMode) {
          store.gotoDetail(membership);
        }
      }}
    />
  );

  const formatPrice = (price, originalPrice) => {
    if (originalPrice && originalPrice !== price) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-bold text-lg">¥{price}</span>
          <span className="text-gray-400 line-through text-sm">¥{originalPrice}</span>
        </div>
      );
    }
    return <span className="text-red-600 font-bold text-lg">¥{price}</span>;
  };

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      <div className="bg-white p-4">
        <ListPage
          isGrouped={false}
          store={store}
          renderItem={renderMembershipCard}
          itemsContainerClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          renderEdit={() => <EditMembershipPage />}
        />
      </div>

      {/* Purchase Confirmation Dialog */}
      {store.showPurchaseDialog && store.selectedMembership && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => store.setShowPurchaseDialog(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium">{t('membership.purchaseConfirm.title')}</h3>
              </div>
              <div className="px-6 py-4">
                <p className="mb-4">{t('membership.purchaseConfirm.message')}</p>
                
                {/* Membership Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">{t('membership.purchaseConfirm.name')}:</span>
                    <span className="ml-2 font-medium">{store.selectedMembership.name}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">{t('membership.purchaseConfirm.type')}:</span>
                    <span className="ml-2 font-medium">{t(store.getTypeLabel(store.selectedMembership.type))}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">{t('membership.purchaseConfirm.price')}:</span>
                    <span className="ml-2">{formatPrice(store.selectedMembership.price, store.selectedMembership.orig_price)}</span>
                  </div>
                </div>

                {/* WeChat Pay Icon */}
                <div className="flex items-center justify-center mb-4">
                  <SiWechat className="text-green-500 text-4xl" />
                  <span className="ml-2 text-gray-600">WeChat Pay</span>
                </div>
              </div>
              <div className="px-6 py-4 flex justify-end gap-4">
                <button
                  onClick={() => store.setShowPurchaseDialog(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('membership.purchaseConfirm.cancel')}
                </button>
                <button
                  onClick={() => store.handlePurchase()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <SiWechat className="text-lg" />
                  {t('membership.purchaseConfirm.purchase')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WeChat Pay Dialog */}
      <WeChatPayDialog
        isOpen={store.showWeChatPayDialog}
        onClose={() => store.closeWeChatPayDialog()}
        orderData={store.paymentOrderData}
        onPaymentSuccess={(data) => store.handlePaymentSuccess(data)}
        onPaymentError={(error) => store.handlePaymentError(error)}
      />
    </div>
  );
});

export default MembershipListPage;
