const { get, save, remove, flat, connect } = require('./utils/db.js');
const { MongoClient } = require('mongodb');

exports.main = async (event, context) => {
  try {
    // await connect()
    // const ts = get('instructors')
    // return ts;
    await MongoClient.connect(process.env.DBCS, { useNewUrlParser: true, useUnifiedTopology: true })
    return "done"
  } catch (e) {
    return e
  }
};
