import { token, clientId, guildId } from './config.mjs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';

const commands = [{
    name: 'createcampaign',
    description: 'Creates roles and channels for a new campaign!',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'name',
            description: 'The name of the campaign. This will be used to create role and channel names.',
            required: true
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'color',
            description: `The hex color code to use for the campaign's roles`
        }
    ]
}];

const rest = new REST({version: '9'}).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), {body: commands})
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);