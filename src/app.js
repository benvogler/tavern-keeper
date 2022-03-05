import { Client, Intents } from 'discord.js';
import { publicKey, token } from './config.js';
import { createcampaign, confirmcreatecampaign } from './commands/createcampaign.js';

import { verifyKey } from 'discord-interactions';
import { respond } from './utils.js';
import InteractionCreateAction from 'discord.js/src/client/actions/InteractionCreate.js';

const client = new Client({intents: [Intents.FLAGS.GUILDS]});

client.login(token);

const commands = {
    createcampaign
};

const buttons = {
    confirmcreatecampaign
};

let interactionCallback;

// Used by Lambda
export async function interaction(event, context, callback) {
    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp'];
    const isValidRequest = verifyKey(event.body, signature, timestamp, publicKey);
    if (!isValidRequest) {
        console.log('Request has invalid signature');
        return respond(401, 'Bad request signature', callback);
    }
    const body = JSON.parse(event.body);
    if (body.type === 1) {
        return respond(200, {type: 1}, callback)
    }
    try {
        console.log('attempting to create interaction')
        new InteractionCreateAction(client).handle(body);
        const result = await new Promise(resolve => {
            interactionCallback = data => resolve(data);
        });
        return respond(200, result, callback);
    } catch (error) {
        return respond(500, 'Something went wrong: ' + error, callback);
    }
}

// Used when running via CLI
client.on('interactionCreate', async interaction => {
    const result = await handleInteraction(interaction);
    if (interactionCallback && typeof interactionCallback === 'function') {
        interactionCallback(result);
    }
});

function handleInteraction(interaction) {
    
    if (interaction.isCommand()) {
        const { commandName } = interaction;
    
        if (!Object.keys(commands).includes(commandName)) {
            return;
        }
    
        return commands[commandName](interaction, client);
    }

    if (interaction.isButton()) {
        const { customId } = interaction;
    
        if (!Object.keys(buttons).includes(customId)) {
            return;
        }
    
        return buttons[customId](interaction, client);
    }
}