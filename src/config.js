import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { token, publicKey, clientId, guildId, channels, developerContactId } = require('../config.json');

export {
    token,
    publicKey,
    clientId,
    guildId,
    channels,
    developerContactId
};
