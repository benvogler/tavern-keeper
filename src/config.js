import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { token, publicKey, clientId, guildId, channels, developerContactId, roleEmojiName, allowedRolesOrUsers } = require('../config.json');

export {
    token,
    publicKey,
    clientId,
    guildId,
    channels,
    developerContactId,
    roleEmojiName,
    allowedRolesOrUsers
};
