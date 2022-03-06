import { Client, Intents } from 'discord.js';
import { token, developerContactId } from './config.js';
import { createcampaign, confirmcreatecampaign } from './commands/createcampaign.js';

const client = new Client({intents: [Intents.FLAGS.GUILDS]});

client.once('ready', () => {
    console.log('Bot started successfully');
});

client.login(token);

const commands = {
    createcampaign
};

const buttons = {
    confirmcreatecampaign
};

// Used when running via CLI
client.on('interactionCreate', async interaction => {
    await handleInteraction(interaction);
});

async function handleInteraction(interaction) {
    try {
        if (interaction.isCommand()) {
            const { commandName } = interaction;
            if (!Object.keys(commands).includes(commandName)) {
                return;
            }
            return await commands[commandName](interaction, client);
        }
        if (interaction.isButton()) {
            const { customId } = interaction;
            if (!Object.keys(buttons).includes(customId)) {
                return;
            }
            return await buttons[customId](interaction, client);
        }
    } catch (error) {
        console.error('Failed to create campaign fully', error);
        const content = `Something went wrong! Send this info to <@${developerContactId}>:\n\`\`\`${error.stack}\`\`\``;
        try {
            await interaction.reply({
                ephemeral: true,
                content
            });
        } catch (e) {
            await interaction.editReply({
                ephemeral: true,
                content
            });
        }
    }
}