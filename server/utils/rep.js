import { getById, getLatest, flatOne, flat, save } from './db.js';

const durations = {
  monthly: 30,
  annually: 365,
  lifetime: 730,
  trial: 1
}

// client
const getComm = (client, content) => {
  let comm = client.comm && client.comm[content];
  if (!comm) {
    if (content === 'text') comm = +process.env.TEXT_MEMBER_COMM_PER_DAY;
    else if (content === 'video') comm = +process.env.VIDEO_MEMBER_COMM_PER_DAY;
  }
  return comm || 0.3;
}

const getLimit = (client, type) => {
  let limit = client?.limits && client?.limits?.[type];
  if (!limit) {
    if (type === 'image') limit = +process.env.IMAGES_PER_DAY;
    else if (type === 'video') limit = +process.env.VIDEOS_PER_DAY;
  }
  return limit || 20;
}

const getCurrentBalance = async clientId => {
  const latestOrder = await getLatestOrder(clientId)
  return (latestOrder && latestOrder.balance) || 0
}

const getClient = async (id) => {
  const client = await flatOne('clients', `m_id=${id}&f_+memberships`)
  client.latestOrder = await getLatestOrder(id)
  client.latestWithdraw = await getLatestWithdraw(id)
  return client
}

const getClientById = async (id) => {
  const client = await getById('clients', id)
  if (!client) throw new Error('Client not found')
  return client
}

// order
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
    type: `${membership.content}_member`,
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

const requestRefund = async ({ orderId }) => {
  const order = await flatOne('orders', `m_id=${orderId}`)
  if (!order) throw new Error('Order not found')
  if (order.status !== 'Paid' || !order.transactionId) throw new Error('Order not refundable')
  order.status = 'Refunding'
  await save('orders', order)
  return { success: true }
}

const getLatestOrder = clientId => getLatest('orders', { client_id: +clientId }, 'paidAt')

const getLatestWithdraw = clientId => getLatest('orders', { client_id: +clientId, type: 'withdraw', status: 'Pending' }, 'date_created')

// user
const getUser = async (phone, clientId) => {
  const users = await flat('users', `m_phone='${phone}'&f_+orders`)
  if (users.length === 0) throw new Error('User not found')
  
  let user
  
  if (users.length === 1) {
    if (users[0].role === 'super' && !users[0].client_id) user = users[0]
    else if (users[0].client_id === clientId) user = users[0]
  } else if (users.length > 1) {
    user = users.find(u => u.client_id === clientId)
  }
  if (!user) throw new Error('User not found')
  
  if (user.client_id) {
    const client = await getClientById(user.client_id)
    if (!user.usage) user.usage = {}
    const types = ['image', 'video']
    types.forEach(t => {
      const m = getLimit(client, t)
      const u = user.usage[t] || {}
      if (u.date) {
        const d = new Date().toDateString()
        if (d === u.date) {
          u.remain = m - (u.used || 0)
          return user
        }
      }
      u.date = new Date().toDateString()
      u.used = 0
      u.remain = m
      user.usage[t] = u
      return user
    })
  }

  return user
}

// membership
const getMembershipById = async (id) => {
  const membership = await getById('memberships', id)
  if (!membership) throw new Error('Membership not found')
  return membership;
}

export {
  getClient,
  getUser,
  getClientById,
  getMembershipById,
  getLatestOrder,
  upgradeAll,
  withdraw,
  createOrder,
  completeOrder,
  completeWithdraw,
  requestRefund,
  getComm,
  getLimit,
};