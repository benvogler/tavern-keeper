import { ChannelType, OverwriteType } from 'discord-api-types/v9';
import { MessageActionRow, MessageButton } from 'discord.js';
import { findOrCreateChannel, normalizePermissionOverwrites, overwritePermissionsProgressively, getCategoryByNameOrId, getMember } from '../utils.js';
import { commandOptions } from '../config.js';
const config = commandOptions.createoneshot;

export async function createoneshot(interaction) {

    let { dm, label } = getOptionsFromCommand(interaction);

    console.log(`Creating a one-shot titled ${label} for DM ${dm}`);

    interaction.reply({
        ephemeral: true,
        content: `You're about to create the one-shot \`${label}\` with the DM ${dm}. Are you sure you want to continue?`,
        components: [
            new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('confirmcreateoneshot')
                        .setLabel('Send it!')
                        .setStyle('PRIMARY')
                )
        ]
    });
}

export async function confirmcreateoneshot(interaction) {

    const channelDefinitions = JSON.parse(JSON.stringify(config.channels));

    const { guild } = interaction;
    const { dm, label, transformedLabel } = await getOptionsFromMessage(interaction);
    const category = getCategoryByNameOrId(guild, config.category);

    interaction.deferReply({ephemeral: true});

    const overwriteOptions = {
        dm: {
            userOrRole: dm,
            type: OverwriteType.Member
        }
    }

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
        content: `:tada: Woot! A new one-shot! Check out <#${createdChannels[0].id}>`
    });
}

function getOptionsFromCommand(interaction) {
    const dm = interaction.options.getMember('dm') || interaction.member;
    const label = interaction.options.getString('label');
    return { dm, label, transformedLabel: transformLabel(label) };
}

async function getOptionsFromMessage(interaction) {

    const { guild } = interaction;

    const split = interaction.message.content.split('`');
    console.log('split options', split);
    const label = split[1];
    const dm = await getMember(guild, interaction.message.content.match(/<@[!]?([^>]+)>/)[1]);

    return { dm, label, transformedLabel: transformLabel(label) };
}

function transformLabel(label) {
    return label.toLowerCase().replace(/\ /g, '-');
}