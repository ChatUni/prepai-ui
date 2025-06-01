import { makeApi } from './utils/http.js';
import apiHandlers from './utils/apiHandlers.js';

export const handler = makeApi(apiHandlers)
