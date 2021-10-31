import { ChannelType, OverwriteType } from 'discord-api-types/v9';
import { Client, Intents, Permissions } from 'discord.js';
import { token } from './config.mjs';

const client = new Client({intents: [Intents.FLAGS.GUILDS]});

client.once('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { guild } = interaction;
    
    const { commandName } = interaction;

    if (commandName !== 'createcampaign') return;

    console.log(`Creating a campaign named ${interaction.options.getString('name')} with color ${interaction.options.getString('color')}`);
    
    const name = interaction.options.getString('name');
    let color = interaction.options.getString('color');
    if (!color.startsWith('#')) {
        color = '#' + color;
    }
    if (!/^#[0-9A-Fa-f]{6}$/i.test(color)) {
        color = '#FFFFFF';
    }

    const playerRole = await guild.roles.create({
        name: `${name} Players`,
        color,
        // permissions: new Permissions()
    });

    const dmRole = await guild.roles.create({
        name: `${name} DM`,
        color,
        // permissions: new Permissions()
    });

    const category = await guild.channels.create(name, {
        type: ChannelType.GuildCategory
    });

    const channels = {
        chat: ChannelType.GuildText,
        roleplay: ChannelType.GuildText,
        rolls: ChannelType.GuildText,
        notes: ChannelType.GuildText
    };
    channels[name] = ChannelType.GuildVoice;
    channels['DM Dungeon'] = ChannelType.GuildVoice;

    for (const channelName in channels) {
        const channel = await guild.channels.create(channelName, {
            type: channels[channelName],
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    type: OverwriteType.Role,
                    deny: [Permissions.ALL]
                },
                {
                    id: playerRole,
                    type: OverwriteType.Role,
                    allow: [Permissions.DEFAULT]
                },
                {
                    id: dmRole,
                    type: OverwriteType.Role,
                    allow: [Permissions.ALL]
                }
            ]
        });
        channels[channelName] = channel;
    }
    

    interaction.reply({
        ephemeral: true,
        content: `:tada: Woot! A new campaign! Check out <#${channels.chat.id}>`
    });
});

client.login(token);