import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { token, publicKey, clientId, guildId, database, channels, roles, developerContactId, roleEmojiName, allowedRolesOrUsers } = require('../config.json');

export {
    token,
    publicKey,
    clientId,
    guildId,
    database,
    channels,
    roles,
    developerContactId,
    roleEmojiName,
    allowedRolesOrUsers
};
