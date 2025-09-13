import { makeApi } from '../../server/utils/http.js';
import apiHandlers from '../../server/utils/apiHandlers.js';

exports.handler = makeApi(apiHandlers);
