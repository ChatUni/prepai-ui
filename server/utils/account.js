const { getById, save, flat, count } = require('./db.js');

const durations = {
  monthly: 30,
  annually: 365,
  lifetime: -1,
  trial: 3
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
    product_id: `membership_${membership.id}`,
    body: `${membership.name} - ${membership.type}`,
    date_created: new Date().toISOString(),
  }

  const cnt = await count('orders')
  orderData.id = cnt + 1

  await save('orders', orderData)
}

const upgradeAll = async ({ userIds, membershipId, phones, clientId }) => {
  const membership = await getById('memberships', membershipId)
  if (!membership) throw new Error('Membership not found')
  if (membership.client_id !== clientId) throw new Error('membership client mismatch')

  const users = await flat('users', `m_client_id=${clientId}`)

  for (const userId of userIds) {
    const user = users.find(u => u.id === userId)
    if (!user) throw new Error('User not found')
  
    await upgrade(user, membership)
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
      await upgrade(user, membership)
    }
  }

  return { success: true }
}

module.exports = {
  upgradeAll
}