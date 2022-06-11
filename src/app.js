import { Client, Intents } from 'discord.js';
import { token, developerContactId, database } from './config.js';
import { CreateCampaign, ConfirmCreateCampaign } from './commands/createcampaign.js';
import { CreateOneshot, ConfirmCreateOneshot } from './commands/createoneshot.js';
import { Sequelize } from 'sequelize';
import { User } from './models/user.js';
import { Campaign } from './models/campaign.js';
import { CampaignMember } from './models/campaignmember.js';
import { CommandAuthorizationError } from './lib/command.js';

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

const commands = [
    CreateCampaign,
    CreateOneshot
];

const buttons = [
    ConfirmCreateCampaign,
    ConfirmCreateOneshot
];

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
        if (interaction.isCommand() || interaction.isButton()) {
            await handleCommand(interaction);
        }
    } catch (error) {
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

async function handleCommand(interaction) {
    let array;
    let name;
    if (interaction.isCommand()) {
        array = commands;
        name = interaction.commandName;
    }
    if (interaction.isButton()) {
        array = buttons;
        name = interaction.customId;
    }
    const commandClass = array.find(item => item.definition.name === name);
    if (!commandClass) {
        return;
    }
    try {
        const command = new commandClass(interaction, client);
        await command.run();
    } catch (error) {
        if (error instanceof CommandAuthorizationError) {
            return await interaction.reply({
                ephemeral: true,
                content: error.message
            });
        } else {
            throw(error);
        }
}