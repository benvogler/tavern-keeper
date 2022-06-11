import { token, clientId, guildId } from './config.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { CreateCampaignDefinition } from './commands/createcampaign.js';
import { CreateOneshotDefinition } from './commands/createoneshot.js';

const commands = [CreateCampaignDefinition, CreateOneshotDefinition];

const rest = new REST({version: '9'}).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), {body: commands})
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);