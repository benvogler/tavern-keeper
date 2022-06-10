import { Permissions } from 'discord.js';
import { ChannelTypes } from 'discord.js/src/util/Constants.js';

export async function getMember(guild, memberId) {
    console.log('looking for member matching', memberId);
    let member = guild.members.cache.find(m => m.id === memberId);
    if (!member) {
        member = await guild.members.fetch(memberId);
        console.log('fetched member', member);
    }
    return member;
}

export function findRole(guild, roleName) {
    return guild.roles.cache.find(role => role.name === roleName);
}

export async function findOrCreateRole(guild, roleDefinition) {
    let role = findRole(guild, roleDefinition.name);
    console.log('got role?', typeof role);
    if (!role) {
        role = await guild.roles.create(roleDefinition);
        console.log('created new role', typeof role, roleDefinition);
    }
    return role;
}

export function findChannel(guild, channelName, channelType) {
    channelType = ChannelTypes[channelType];
    return guild.channels.cache
        .find(channel => channel.name === channelName && (!channelType || channel.type === channelType));
}

export async function findOrCreateChannel(guild, channelDefinition) {
    let channel = findChannel(guild, channelDefinition.name, channelDefinition.type);
    console.log('got channel?', typeof channel);
    if (!channel) {
        const name = channelDefinition.name;
        delete channelDefinition.name;
        channel = await guild.channels.create(name, channelDefinition);
        console.log('created new channel', typeof channel, name, channelDefinition);
    }
    return channel;
}

export function normalizePermissionOverwrites(permissionOverwrites, options) {
    if (!permissionOverwrites) return;
    return permissionOverwrites.map(overwrite => {
        overwrite = {...overwrite};

        const who = options[overwrite.who];
        overwrite.userOrRole = who.userOrRole;
        overwrite.type = who.type;
        delete overwrite.who;

        for (const type of ['allow', 'deny']) {
            if (!overwrite[type]) continue;
            overwrite[type] = overwrite[type].map(permission => {
                switch (permission) {
                    case 'ALL':
                        return Permissions.ALL;
                    case 'DEFAULT':
                        return Permissions.DEFAULT;
                    default:
                        return permission;
                }
            });
        }
        return overwrite;
    });
}

export async function overwritePermissionsProgressively(channel, permissionOverwrites) {
    if (!permissionOverwrites) return;
    console.log('progressively overwriting permissions', permissionOverwrites);
    // Set the initial permissions based on Permissions.ALL or Permissions.DEFAULT if provided
    const initialPermissions = permissionOverwrites.map(overwrites => {
        overwrites = {...overwrites};
        if (!overwrites.allow && !overwrites.deny) {
            return null;
        }
        const permissions = {};
        if (overwrites.allow) {
            permissions.allow = overwrites.allow;
        } else {
            permissions.deny = overwrites.deny;
        }
        permissions.id = overwrites.userOrRole.id;
        return permissions;
    }).filter(permissions => permissions);
    if (initialPermissions.length) {
        console.log('setting initial permissions', initialPermissions);
        await channel.permissionOverwrites.set(initialPermissions);
    }
    // Then overwrite individual permissions if provided
    for (let overwrites of permissionOverwrites) {
        overwrites = {...overwrites};
        if (overwrites.overwrites) {
            console.log('overwriting permissions', overwrites.overwrites);
            await channel.permissionOverwrites.edit(overwrites.userOrRole, overwrites.overwrites);
        }
    }
}

export function getCategoryByNameOrId(guild, nameOrId) {
    return guild.channels.cache
        .find(channel =>
            channel.type === 'GUILD_CATEGORY' &&
            [channel.id.toLowerCase(), channel.name.toLowerCase()].includes(nameOrId.toLowerCase())
        );
}