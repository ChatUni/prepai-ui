import { makeApi } from './utils/http';
import apiHandlers from './utils/apiHandlers.js';

export const handler = makeApi(apiHandlers)
