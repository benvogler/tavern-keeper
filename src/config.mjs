import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { token, clientId, guildId } = require('../config.json');

export {
    token,
    clientId,
    guildId
};
