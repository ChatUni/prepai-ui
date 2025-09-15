export default class Order {
  id
  prepay_id
  code_url
  amount
  duration
  status
  user_id
  client_id
  type
  product_id
  body
  comm
  expires
  date_created
  expireDate
  paidAt
  systemCost
  net
  balance

  constructor(order) {
    Object.assign(this, order)
  }

  get title() { return this.body.split(' - ')[0] }

  get isPaid() { return this.status.toLowerCase() === 'paid' || this.status.toLowerCase() === 'refunded' }

  get isPending() { return this.status.toLowerCase() === 'pending' }

  get isPendingRefund() { return this.status.toLowerCase() === 'refunding' }

  get isCancelled() { return this.status.toLowerCase() === 'cancelled' }

  get isMembership() { return this.type.toLowerCase().endsWith('_member') }

  get isSeries() { return this.type.toLowerCase() === 'series' }

  get isWithdraw() { return this.type.toLowerCase() === 'withdraw' }

  get isRecharge() { return this.type.toLowerCase() === 'recharge' }

  get isPendingWithdraw() { return this.isWithdraw && this.isPending }

  get isPaidWithdraw() { return this.isWithdraw && this.isPaid }

  get isUpgrade() { return this.source?.toLowerCase() === 'upgrade' }

  get hasSystemCost() { return this.isMembership }

  get isRefundable() {
    if (!(this.isPaid || this.isPendingRefund) || this.isWithdraw || this.isRecharge) {
      return false;
    }

    const now = new Date();
    const paidAt = new Date(this.paidAt);
    const duration = this.duration || 0;

    if (duration > 7) {
      // If duration > 7 days, refundable when now - paidAt < 7 days
      const daysSincePaid = (now - paidAt) / (1000 * 60 * 60 * 24);
      return daysSincePaid < 7;
    } else {
      // Otherwise, refundable when now < expireDate  
      const expireDate = new Date(this.expireDate);
      return now < expireDate;
    }
  }
}
