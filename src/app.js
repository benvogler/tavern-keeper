import { Client, Intents } from 'discord.js';
import { token, developerContactId, commandOptions, database } from './config.js';
import { createcampaign, confirmcreatecampaign } from './commands/createcampaign.js';
import { createoneshot, confirmcreateoneshot } from './commands/createoneshot.js';
import { Sequelize } from 'sequelize';
import { User } from './models/user.js';
import { Campaign } from './models/campaign.js';
import { CampaignMember } from './models/campaignmember.js';

const client = new Client({intents: new Intents().add([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS])});
const sequelize = new Sequelize(`postgres://${database.user}:${database.password}@${database.url}:${database.port}/${database.name}`);

client.once('ready', async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({force: true});
        console.log('Bot started successfully');
    } catch (error) {
        console.error('Failed to connect to database', error);
    }
});

client.login(token);

const commands = {
    createcampaign,
    createoneshot
};

const buttons = {
    confirmcreatecampaign,
    confirmcreateoneshot
};

const models = {
    Campaign: Campaign(sequelize),
    User: User(sequelize),
    CampaignMember: CampaignMember(sequelize)
};

models.Campaign.hasOne(models.User, {foreignKey: 'dm'});
models.Campaign.belongsToMany(models.User, {through: models.CampaignMember});
models.User.belongsToMany(models.Campaign, {through: models.CampaignMember});

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
            if (!commandOptions[commandName].allowedRolesOrUsers.includes(interaction.member.id) &&
                !commandOptions[commandName].allowedRolesOrUsers.some(item => roleIds.includes(item))) {
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