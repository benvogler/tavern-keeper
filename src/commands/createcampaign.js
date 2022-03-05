import { ChannelType, OverwriteType } from 'discord-api-types/v9';
import { MessageActionRow, MessageButton, Permissions } from 'discord.js';
import { channelNames } from '../config.js';

function getOptions(interaction) {
    const dm = interaction.options.getMember('dm');
    const title = interaction.options.getString('title');
    const label = interaction.options.getString('label');
    const transformedLabel = transformLabel(label);
    let color = interaction.options.getString('color');
    if (!color.startsWith('#')) {
        color = '#' + color;
    }
    if (!/^#[0-9A-Fa-f]{6}$/i.test(color)) {
        color = '#FFFFFF';
    }
    return { dm, title, label, transformedLabel, color };
}

function transformLabel(label) {
    return label.toLowerCase().replace(/\ /g, '-');
}

export async function createcampaign(interaction) {

    const { dm, title, label, transformedLabel, color } = getOptions(interaction);
    
    console.log('options?', {dm, title, label, color});

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

    const { guild } = interaction;
    
    const split = interaction.message.content.split('`');
    const title = split[1];
    const label = split[3].replace('@', '');
    const transformedLabel = transformLabel(label);
    const color = split[5];
    const memberId = interaction.message.content.match(/<@[!]?([^>]+)>/)[1];
    console.log('looking for member matching', memberId);
    let dm = guild.members.cache.find(member => member.id === memberId);
    if (!dm) {
        dm = await guild.members.fetch(memberId);
        console.log('fetched user', dm);
    }

    interaction.deferReply({ephemeral: true});

    let campaignRole = guild.roles.cache.find(role => role.name === label);
    console.log('got campaignRole?', typeof campaignRole);
    if (!campaignRole) {
        campaignRole = await guild.roles.create({
            name: label,
            color,
            // permissions: new Permissions()
        });
        console.log('created new campaignRole', typeof campaignRole);
    }

    let dmRole = guild.roles.cache.find(role => role.name === 'DM');
    console.log('got dmRole?', typeof dmRole);
    if (!dmRole) {
        dmRole = await guild.roles.create({
            name: 'DM',
            color: '#ffffff',
            // permissions: new Permissions()
        });
        console.log('created new dmRole', typeof dmRole);
    }

    await dm.roles.add(dmRole);
    await dm.roles.add(campaignRole);

    console.log('assigned roles to dm');

    let category = guild.channels.cache.find(channel => channel.name === title && channel.type === 'GUILD_CATEGORY');
    console.log('got category?', typeof category);
    if (!category) {
        category = await guild.channels.create(title, {
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    type: OverwriteType.Role,
                    deny: [Permissions.ALL]
                }
            ]
        });
        console.log('created new category', typeof category);
    }

    await category.permissionOverwrites.set([
        {
            id: guild.roles.everyone,
            type: OverwriteType.Role,
            deny: [Permissions.ALL]
        },
        {
            id: campaignRole.id,
            type: OverwriteType.Role,
            allow: [Permissions.DEFAULT]
        },
        {
            id: dm.id,
            type: OverwriteType.Member,
            allow: [Permissions.ALL]
        }
    ]);

    console.log('updated category');

    const channels = {};
    for (let channel of channelNames.text) {
        channels[[transformedLabel, channel].join('-')] = ChannelType.GuildText;
    }
    for (let channel of channelNames.voice) {
        channels[[label, channel].join(' ')] = ChannelType.GuildVoice;
    }

    for (const channelName in channels) {
        let channel = guild.channels.cache.find(c => c.name === channelName);
        console.log(`got channel "${channelName}"?`, typeof channel);
        if (!channel) {
            channel = await guild.channels.create(channelName, {
                type: channels[channelName],
                parent: category.id
            });
            console.log(`created new channel "${channelName}"`, typeof channel);
        }
        await channel.lockPermissions();
        console.log('locked channel permissions');
        channels[channelName] = channel;
    }

    interaction.editReply({
        ephemeral: true,
        content: `:tada: Woot! A new campaign! Check out <#${channels[Object.keys(channels)[0]].id}>`
    });
}