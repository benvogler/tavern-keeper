import { Client, Intents } from 'discord.js';
import { token } from './config.js';
import { createcampaign, confirmcreatecampaign } from './commands/createcampaign.js';

const client = new Client({intents: [Intents.FLAGS.GUILDS]});

client.login(token);

const commands = {
    createcampaign
};

const buttons = {
    confirmcreatecampaign
};

// Used when running via CLI
client.on('interactionCreate', async interaction => {
    handleInteraction(interaction);
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