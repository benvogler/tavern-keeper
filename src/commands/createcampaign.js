import { ChannelType, OverwriteType } from 'discord-api-types/v9';
import { MessageActionRow, MessageButton } from 'discord.js';
import { channels } from '../config.js';
import { findOrCreateChannel, findOrCreateRole, getOptionsFromCommand, getOptionsFromMessage, normalizePermissionOverwrites, overwritePermissionsProgressively } from '../utils.js';

export async function createcampaign(interaction) {

    const { dm, title, label, transformedLabel, color } = getOptionsFromCommand(interaction);

    console.log(`Creating a campaign titled ${title} with the label "${label}" for DM ${dm} and with color ${color}`);

    interaction.reply({
        ephemeral: true,
        content: `You're about to create the campaign \`${title}\`, with the role \`@${label}\` with the color \`${color}\`, for the DM ${dm}, with channels that look like \`#${transformedLabel}-chat\`. Are you sure you want to continue?`,
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
    const { dm, title, label, transformedLabel, color } = await getOptionsFromMessage(interaction);

    interaction.deferReply({ephemeral: true});

    const campaignRole = await findOrCreateRole(guild, {
        name: label,
        color
    });

    const dmRole = await findOrCreateRole(guild, {
        name: 'DM',
        color: '#ffffff'
    });

    if (dmRole && dm.roles) {
        await dm.roles.add(dmRole);
        await dm.roles.add(campaignRole);
        console.log('assigned roles to dm');
    }

    const annexRole = await findOrCreateRole(guild, {
        name: 'Guild Annex',
        color: '#ffffff'
    });

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

    const category = await findOrCreateChannel(guild, {
        name: title,
        type: ChannelType.GuildCategory
    });

    console.trace('why is this not being caught?');
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