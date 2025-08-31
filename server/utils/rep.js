const { getById } = require('./db.js');

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

module.exports = {
  getClientById,
  getMembershipById,
}