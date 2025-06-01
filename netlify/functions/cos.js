import { makeApi } from './utils/http';
import cosHandlers from './utils/cosHandlers';

export const handler = makeApi(cosHandlers)
