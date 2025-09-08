const { getById, getLatest, flatOne, flat } = require('./db.js');

const getClient = async (id) => {
  const client = await flatOne('clients', `m_id=${id}&f_+memberships`)
  client.latestOrder = await getLatestOrder(id)
  client.latestWithdraw = await getLatestWithdraw(id)
  return client
}

const getUser = async (phone, clientId) => {
  const users = await flat('users', `m_phone='${phone}'&f_+orders`)
  if (users.length === 0) throw new Error('User not found')
  if (users.length === 1) {
    if (users[0].role === 'super' && !users[0].client_id) return users[0]
    else if (users[0].client_id === clientId) return users[0]
  } else if (users.length > 1) {
    const user = users.find(u => u.client_id === clientId)
    if (user) return user
  }
  throw new Error('User not found')
}

const getClientById = async (id) => {
  const client = await getById('clients', id)
  if (!client) throw new Error('Client not found')
  return client
}

const getMembershipById = async (id) => {
  const membership = await getById('memberships', id)
  if (!membership) throw new Error('Membership not found')
  return membership;
}

const getLatestOrder = clientId => getLatest('orders', { client_id: +clientId }, 'paidAt')

const getLatestWithdraw = clientId => getLatest('orders', { client_id: +clientId, type: 'withdraw', status: 'Pending' }, 'date_created')

module.exports = {
  getClient,
  getUser,
  getClientById,
  getMembershipById,
  getLatestOrder,
}