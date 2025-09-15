export const orderStatuses = ['paid', 'pending', 'refunding', 'refunded', 'cancelled']
export const orderTypes = ['text_member', 'video_member', 'series', 'recharge', 'withdraw', 'refund']

export class Order {
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

  get isPaid() { return this.status.toLowerCase() === 'paid' }

  get isPending() { return this.status.toLowerCase() === 'pending' }

  get isPendingRefund() { return this.status.toLowerCase() === 'refunding' }

  get isRefunded() { return this.status.toLowerCase() === 'refunded' }

  get isCancelled() { return this.status.toLowerCase() === 'cancelled' }

  get isMembership() { return this.type.toLowerCase().endsWith('_member') }

  get isSeries() { return this.type.toLowerCase() === 'series' }

  get isRefund() { return this.type.toLowerCase() === 'refund' }

  get isWithdraw() { return this.type.toLowerCase() === 'withdraw' }

  get isRecharge() { return this.type.toLowerCase() === 'recharge' }

  get isWithdrawRecharge() { return this.isWithdraw || this.isRecharge }

  get isPendingWithdraw() { return this.isWithdraw && this.isPending }

  get isPaidWithdraw() { return this.isWithdraw && this.isPaid }

  get isUpgrade() { return this.source?.toLowerCase() === 'upgrade' }

  get hasSystemCost() { return this.isMembership }

  get isRefundableType() { return this.isMembership || this.isSeries }

  get isRefundableStatus() { return this.isPaid }

  get isRefundable() {
    if (!this.isRefundableType || !this.isRefundableStatus) return false;

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

  isIncludedInTotal = function(field) {
    if (this.isWithdrawRecharge) return false
    if (field === 'amount') return !this.isUpgrade // gross doesn't count upgrade
    return true // systemCost/net count upgrade, gross - systemCost = net
  }
}
