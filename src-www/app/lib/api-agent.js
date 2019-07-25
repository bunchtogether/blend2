// @flow

import superagent from 'superagent';
import makeAgent from 'superagent-use';
import prefix from 'superagent-prefix';

export const agent = makeAgent(superagent);

const BLEND_PROTOCOL = process.env.BLEND_PROTOCOL || window.location.protocol.replace(':', '');
const BLEND_HOST = process.env.BLEND_HOST || window.location.hostname;
const BLEND_PORT = process.env.BLEND_PORT || window.location.port || (BLEND_PROTOCOL === 'https' ? 443 : 80);

agent.use(prefix(`${BLEND_PROTOCOL}://${BLEND_HOST}:${BLEND_PORT}`));

