import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiDollarSign, FiChevronRight } from 'react-icons/fi';
import userStore from '../../../stores/userStore';
import { t } from '../../../stores/languageStore';
import Page from '../../ui/Page';
import Button from '../../ui/Button';
import PaymentManager from '../../ui/PaymentManager';
import clientStore from '../../../stores/clientStore';
import paymentManagerStore from '../../../stores/paymentManagerStore';

const MyAccountPage = observer(() => {
  const navigate = useNavigate();

  const handleWithdraw = () => {
    console.log('Withdraw clicked');
    // TODO: Implement withdraw functionality
  };

  const handleRecharge = () => {
    paymentManagerStore.startRecharge();
  };

  const handleWithdrawalRecords = () => {
    console.log('Withdrawal records clicked');
    // TODO: Navigate to withdrawal records page
  };

  return (
    <Page store={userStore} title={t('menu.account_page.account_balance')}>
        <div className="px-6 pt-4 pb-4">
          {/* Balance Display */}
          <div className="mb-2">
            <div className="text-4xl font-bold mb-4 text-gray-900">
              ¥{(clientStore.client.balance || 0).toFixed(2)}
            </div>
            {/* <div className="text-gray-600 text-sm">
              {t('menu.account_page.cumulative_earnings')}：¥{userStore.cumulativeEarnings.toFixed(2)}
            </div> */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 gap-4">
            {/* Withdraw Button */}
            <Button
              onClick={handleWithdraw}
              icon={FiCreditCard}
              color="blue"
              className="rounded-lg p-4 shadow-lg"
            >
              {t('menu.account_page.withdraw')}
            </Button>

            {/* Recharge Button */}
            <Button
              onClick={handleRecharge}
              icon={FiDollarSign}
              color="gray"
              className="rounded-lg p-4 shadow-lg bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300"
            >
              {t('menu.account_page.recharge')}
            </Button>
          </div>
        </div>

        {/* Payment Manager handles all payment dialogs */}
        <PaymentManager />
    </Page>
  );
});

export default MyAccountPage;