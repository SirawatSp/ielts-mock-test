import { handleNodeApi } from '../server/http.mjs';
export default function handler(req, res) { return handleNodeApi(req, res, { trustedProxy: true }); }
