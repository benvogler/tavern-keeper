import { Client, Intents } from 'discord.js';
import { token, developerContactId, allowedRolesOrUsers } from './config.js';
import { createcampaign, confirmcreatecampaign } from './commands/createcampaign.js';
import { countcampaigns } from './commands/countcampaigns.js';

const client = new Client({intents: new Intents().add([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS])});

client.once('ready', () => {
    console.log('Bot started successfully');
});

client.login(token);

const commands = {
    createcampaign, countcampaigns
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
            const roleIds = interaction.member.roles.cache.map(role => role.id);
            if (!allowedRolesOrUsers.includes(interaction.member.id) &&
                !allowedRolesOrUsers.some(item => roleIds.includes(item))) {
                return await interaction.reply({
                    ephemeral: true,
                    content: `Sorry, you don't have access to do that.`
                });
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