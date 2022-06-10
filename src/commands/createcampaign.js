import { ChannelType, OverwriteType } from 'discord-api-types/v9';
import { MessageActionRow, MessageButton } from 'discord.js';
import { channels, roleEmojiName, roles } from '../config.js';
import { findOrCreateChannel, findOrCreateRole, normalizePermissionOverwrites, overwritePermissionsProgressively, getCategoryByNameOrId, getMember } from '../utils.js';

export async function createcampaign(interaction, oneshot=false) {

    const { guild } = interaction;
    let { dm, title, label, transformedLabel, category, color } = getOptionsFromCommand(interaction);
    if (category) {
        category = getCategoryByNameOrId(guild, category);
        console.log('got category', category.name);
    }

    console.log(`Creating a campaign titled ${title} with the label "${label}" for DM ${dm}${category ? ` in the category ${category.name}` : ''} and with color ${color}`);

    interaction.reply({
        ephemeral: true,
        content: `You're about to create the campaign \`${title}\`, with the role \`@${label}\` with the color \`${color}\`, for the DM ${dm}${category ? `, in the category \`${category.name}\`` : ''}, with channels that look like \`#${transformedLabel}-chat\`. Are you sure you want to continue?`,
        components: [
            new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('confirmcreatecampaign')
                        .setLabel('Send it!')
                        .setStyle('PRIMARY')
                )
        ]
    });
}

export async function confirmcreatecampaign(interaction) {

    const channelDefinitions = JSON.parse(JSON.stringify(channels));

    const { guild } = interaction;
    let { dm, title, label, transformedLabel, color, category, oneshot } = await getOptionsFromMessage(interaction);
    if (category) {
        console.log('getting category', category);
        category = getCategoryByNameOrId(guild, category);
        console.log('got category', category.name);
    }

    interaction.deferReply({ephemeral: true});

    const roleEmoji = guild.emojis.cache.find(emoji => emoji.name === roleEmojiName);

    const campaignRole = await findOrCreateRole(guild, {
        name: label,
        color,
        icon: roleEmoji
    });

    const dmRole = await guild.roles.fetch(roles.dm);

    if (dmRole && dm.roles) {
        await dm.roles.add(dmRole);
        await dm.roles.add(campaignRole);
        console.log('assigned roles to dm');
    }

    const annexRole = await guild.roles.fetch(roles.annex);

    const overwriteOptions = {
        everyone: {
            userOrRole: guild.roles.everyone,
            type: OverwriteType.Role
        },
        players: {
            userOrRole: campaignRole,
            type: OverwriteType.Role
        },
        dm: {
            userOrRole: dm,
            type: OverwriteType.Member
        },
        staff: {
            userOrRole: annexRole,
            type: OverwriteType.Role
        }
    }

    if (!category) {
        category = await findOrCreateChannel(guild, {
            name: title,
            type: ChannelType.GuildCategory
        });
        console.log('no category provided, retrieved', category.name);
    }

    await overwritePermissionsProgressively(
        category,
        normalizePermissionOverwrites(channelDefinitions.category.permissionOverwrites, overwriteOptions)
    );

    console.log('updated category');

    const flatDefinitions = [];
    if (channelDefinitions.text) {
        for (const channel of channelDefinitions.text) {
            channel.name = [transformedLabel, channel.name].join('-');
            channel.type = ChannelType.GuildText;
        }
        flatDefinitions.push(...channelDefinitions.text);
    }
    if (channelDefinitions.voice) {
        for (const channel of channelDefinitions.voice) {
            channel.name = [label, channel.name].join(' ');
            channel.type = ChannelType.GuildVoice;
        }
        flatDefinitions.push(...channelDefinitions.voice);
    }

    const createdChannels = [];
    for (const channelDefinition of flatDefinitions) {
        const permissions = channelDefinition.permissionOverwrites;
        delete channelDefinition.permissionOverwrites;
        const channel = await findOrCreateChannel(guild, {
            ...channelDefinition,
            parent: category.id
        });
        await channel.lockPermissions();
        console.log('locked channel permissions');
        if (permissions) {
            await overwritePermissionsProgressively(
                channel,
                normalizePermissionOverwrites(permissions, overwriteOptions)
            );
            console.log('overwrote permissions');
        }
        createdChannels.push(channel);
    }

    interaction.editReply({
        ephemeral: true,
        content: `:tada: Woot! A new campaign! Check out <#${createdChannels[0].id}>`
    });
}

function getOptionsFromCommand(interaction) {
    const dm = interaction.options.getMember('dm');
    const title = interaction.options.getString('title');
    const label = interaction.options.getString('label');
    const transformedLabel = transformLabel(label);
    const category = interaction.options.getString('category');
    let color = interaction.options.getString('color');
    if (color && !color.startsWith('#')) {
        color = '#' + color;
    }
    if (!color || !/^#[0-9A-Fa-f]{6}$/i.test(color)) {
        color = '#FFFFFF';
    }
    return { dm, title, label, transformedLabel, color, category };
}

async function getOptionsFromMessage(interaction) {

    const { guild } = interaction;

    const split = interaction.message.content.split('`');
    const title = split[1];
    const label = split[3].replace('@', '');
    const transformedLabel = transformLabel(label);
    const color = split[5];
    const category = split.length > 10 ? split[7] : null;
    const dm = await getMember(guild, interaction.message.content.match(/<@[!]?([^>]+)>/)[1]);

    console.log(split);
    console.log({color, category})

    return { dm, title, label, transformedLabel, color, category };
}

function transformLabel(label) {
    return label.toLowerCase().replace(/\ /g, '-');
}