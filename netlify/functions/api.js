const { makeApi } = require('../../functions/api/utils/http.js');
const apiHandlers = require('../../functions/api/utils/apiHandlers.js');

exports.handler = makeApi(apiHandlers);
