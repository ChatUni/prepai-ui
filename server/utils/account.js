const { getById, save, flat, count, getLatest } = require('./db.js');
const { getClientById, getMembershipById, getLatestOrder } = require('./rep.js');
const e = require('express');

const durations = {
  monthly: 30,
  annually: 365,
  lifetime: 730,
  trial: 1
}

const getComm = (client, content) => {
  let comm = client.comm && client.comm[content];
  if (!comm) {
    if (content === 'text') comm = +process.env.TEXT_MEMBER_COMM_PER_DAY;
    else if (content === 'video') comm = +process.env.VIDEO_MEMBER_COMM_PER_DAY;
  }
  return comm || 0.3;
}

const getCurrentBalance = async clientId => {
  const latestOrder = await getLatestOrder(clientId)
  return (latestOrder && latestOrder.balance) || 0
}

const createOrder = async (order, balance) => {
  order.date_created = new Date().toISOString()

  if (order.duration) {
    if (typeof order.duration === 'string') order.duration = durations[order.duration]
    order.expireDate = new Date(Date.now() + (order.duration * 24 * 60 * 60 * 1000)).toISOString()
  }

  if (order.type === 'withdraw') await payOrder(order, balance)
  
  if (order.status?.toLowerCase() === 'pending')
    await save('orders', order)
  else
    await completeOrder(order, balance)
}

// happens at createOrder for withdraw, completeOrder otherwise
const payOrder = async (order, balance) => {
  if (!balance) balance = await getCurrentBalance(order.client_id)

  order.paidAt = new Date().toISOString()

  if (order.comm && order.duration) {
    const isUpgrade = order.source === 'upgrade'
    order.systemCost = -order.comm * order.duration
    order.net = isUpgrade ? order.systemCost : order.amount + order.systemCost;
    order.balance = balance + order.net;
  } else {
    order.net = order.amount;
    order.balance = balance + order.amount;
  }
}

const completeOrder = async (order, balance, isCancelled, transactionId) => {
  if (isCancelled) {
    order.status = 'Cancelled'
    order.cancelledAt = new Date().toISOString()
  } else {
    if (order.type !== 'withdraw') await payOrder(order, balance)
    order.status = 'Paid'
    if (transactionId) order.transactionId = transactionId
  }

  await save('orders', order)
}

const upgrade = async (client, user, membership, balance) => {
  const order = {
    amount: membership.price,
    duration: membership.type,
    comm: getComm(client, membership.content),
    client_id: user.client_id,
    user_id: user.id,
    type: "membership",
    source: "upgrade",
    product_id: membership.id,
    body: `${membership.name} - ${membership.type}`,
  }

  await createOrder(order, balance)
  return order.balance
}

const upgradeAll = async ({ userIds, membershipId, phones, clientId }) => {
  const client = await getClientById(clientId)
  const membership = await getMembershipById(membershipId)
  if (membership.client_id !== clientId) throw new Error('membership client mismatch')

  let balance = await getCurrentBalance(clientId)
  const cost = getComm(client, membership.content) * durations[membership.type] * userIds.length
  if (balance < cost) throw new Error(`此次升级需扣款¥${cost}，当前余额为¥${balance}，请先充值`)

  const users = await flat('users', `m_client_id=${clientId}`)

  for (const userId of userIds) {
    const user = users.find(u => u.id === userId)
    if (!user) throw new Error('User not found')
  
    balance = await upgrade(client, user, membership, balance)
  }

  for (const phone of phones) {
    let user = users.find(u => u.phone === phone)
    if (!user) {
      user = {
        id: +phone * 10000 + clientId,
        phone: phone,
        client_id: clientId,
        name: '游客',
        role: 'user',
        date_created: new Date().toISOString(),
      }
      await save('users', user)
      balance = await upgrade(client, user, membership, balance)
    }
  }

  return { success: true }
}

const withdraw = async ({ clientId, userId, amount, userName, bankAccount, bankName }) => {
  const balance = await getCurrentBalance(clientId)
  if (balance < amount) throw new Error('余额不足。')

  const order = {
    amount: -amount,
    status: "Pending",
    client_id: clientId,
    user_id: userId,
    type: "withdraw",
    body: '',
    userName,
    bankName,
    bankAccount,
  }

  await createOrder(order, balance)

  return { success: true }
}

const completeWithdraw = async ({ orderId }) => {
  const order = await getById('orders', orderId)
  if (!order) throw new Error('Order not found')
  await completeOrder(order)
  return { success: true }
}

module.exports = {
  upgradeAll,
  withdraw,
  createOrder,
  completeOrder,
  completeWithdraw,
  getComm,
}