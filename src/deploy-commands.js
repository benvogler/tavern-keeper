import { token, clientId, guildId } from './config.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';

const commands = [
    {
        name: 'createcampaign',
        description: 'Creates roles and channels for a new campaign!',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'dm',
                description: 'The User who is the DM of the campaign.',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'title',
                description: 'The long form title of the campaign. Used for the section name.',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'label',
                description: 'The short label of the campaign, preferably one or two words. Used to create role and channel names.',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'color',
                description: `The hex color code to use for the campaign's roles`
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'category',
                description: `Optional name or id of an existing category to create this campaign under`
            }
        ]
    },
    {
        name: 'createoneshot',
        description: 'Creates a channel for a new one-shot!',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'dm',
                description: 'The User who is the DM of the campaign.',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'title',
                description: 'The long form title of the campaign. Used for the section name.',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'label',
                description: 'The short label of the campaign, preferably one or two words. Used to create role and channel names.',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'color',
                description: `The hex color code to use for the campaign's roles`
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'category',
                description: `Optional name or id of an existing category to create this campaign under`
            }
        ]
    }
];

const rest = new REST({version: '9'}).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), {body: commands})
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);