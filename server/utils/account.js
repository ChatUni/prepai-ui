const { getById, save, flat, count } = require('./db.js');
const { getClientById, getMembershipById } = require('./rep.js');

const durations = {
  monthly: 30,
  annually: 365,
  lifetime: 730,
  trial: 1
}

const getCommCost = (client, type) => {
  const comm = client.commPerDay || +process.env.VITE_COMM_PER_DAY || 0.5
  return comm * durations[type]
}

const upgrade = async (user, membership) => {
  const duration = durations[membership.type];
  const orderData = {
    amount: membership.price,
    duration: duration,
    expireDate: new Date(Date.now() + (duration * 24 * 60 * 60 * 1000)).toISOString(),
    status: "PAID",
    client_id: user.client_id,
    user_id: user.id,
    type: "membership",
    product_id: membership.id,
    body: `${membership.name} - ${membership.type}`,
    date_created: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  }

  await save('orders', orderData)
}

const upgradeAll = async ({ userIds, membershipId, phones, clientId }) => {
  const client = await getClientById(clientId)
  const membership = await getMembershipById(membershipId)
  if (membership.client_id !== clientId) throw new Error('membership client mismatch')

  const cost = getCommCost(client, membership.type) * userIds.length
  if (client.balance < cost) throw new Error(`此次升级需扣款¥${cost}，当前余额为¥${client.balance}，请先充值`)

  const users = await flat('users', `m_client_id=${clientId}`)

  for (const userId of userIds) {
    const user = users.find(u => u.id === userId)
    if (!user) throw new Error('User not found')
  
    await upgrade(user, membership)
  }

  client.balance = client.balance - cost
  await save('clients', client);


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
      await upgrade(user, membership)
    }
  }

  return { success: true }
}

const withdraw = async ({ clientId, userId, amount, userName, bankAccount, bankName }) => {
  const client = await getClientById(clientId)
  if (client.balance < amount) throw new Error('余额不足')

  const orderData = {
    amount: amount,
    status: "Pending",
    client_id: clientId,
    user_id: userId,
    type: "withdraw",
    body: '',
    date_created: new Date().toISOString(),
    userName,
    bankName,
    bankAccount,
  }

  client.balance = client.balance - amount
  client.withdraw = orderData
  
  await save('clients', client)
  await save('orders', orderData)

  return { success: true }
}

module.exports = {
  upgradeAll,
  withdraw,
  getCommCost
}