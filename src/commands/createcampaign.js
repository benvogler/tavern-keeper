import { ChannelType, OverwriteType, ApplicationCommandOptionType } from 'discord-api-types/v9';
import { MessageActionRow, MessageButton } from 'discord.js';

import { Command } from '../lib/command.js';
import { findOrCreateChannel, findOrCreateRole, normalizePermissionOverwrites, overwritePermissionsProgressively, getCategoryByNameOrId, getMember } from '../utils.js';
import { commandOptions } from '../config.js';
const config = commandOptions.createcampaign;

export const CreateCampaignDefinition = {
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
};

export class CreateCampaign extends Command {

    static definition = CreateCampaignDefinition;
    static allowedRolesOrUsers = config.allowedRolesOrUsers;

    constructor(interaction, client) {
        super(interaction, client, CreateCampaign.definition, CreateCampaign.allowedRolesOrUsers);
        this.options = this.transformOptions();
    }

    async execute() {

        const { dm, title, label, transformedLabel, category, color } = this.options;

        console.log(`Creating a campaign titled ${title} with the label "${label}" for DM ${dm}${category ? ` in the category ${category.name}` : ''} and with color ${color}`);

        this.interaction.reply({
            ephemeral: true,
            content: `You're about to create the campaign \`${title}\`, with the role \`@${label}\` with the color \`${color}\`, for the DM ${dm}${category ? `, in the category \`${category.name}\`` : ''}, with channels that look like \`#${transformedLabel}-chat\`. Are you sure you want to continue?`,
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(ConfirmCreateCampaign.definition.name)
                            .setLabel('Send it!')
                            .setStyle('PRIMARY')
                    )
            ]
        });
    }

    transformOptions() {
        const { guild } = this.interaction;
        let { dm, title, label, category, color } = this.options;
        const transformedLabel = transformLabel(label);
        if (category) {
            category = getCategoryByNameOrId(guild, category);
        }
        if (color && !color.startsWith('#')) {
            color = '#' + color;
        }
        if (!color || !/^#[0-9A-Fa-f]{6}$/i.test(color)) {
            color = '#FFFFFF';
        }
        return { dm, title, label, transformedLabel, category, color };
    }
}

export const ConfirmCreateCampaignDefinition = {
    name: 'confirmcreatecampaign'
};

export class ConfirmCreateCampaign extends Command {

    static definition = ConfirmCreateCampaignDefinition;
    static allowedRolesOrUsers = config.allowedRolesOrUsers;

    constructor(interaction, client) {
        super(interaction, client, ConfirmCreateCampaign.definition, ConfirmCreateCampaign.allowedRolesOrUsers);
    }

    async execute() {

        const { guild } = this.interaction;
        let { dm, title, label, transformedLabel, color, category } = await this.getOptions();
        const channelDefinitions = JSON.parse(JSON.stringify(config.channels));

        this.interaction.deferReply({ephemeral: true});
        const roleEmoji = guild.emojis.cache.find(emoji => emoji.name === config.roleEmojiName);

        const campaignRole = await findOrCreateRole(guild, {
            name: label,
            color,
            icon: roleEmoji
        });

        const dmRole = await guild.roles.fetch(config.roles.dm);

        if (dmRole && dm.roles) {
            await dm.roles.add(dmRole);
            await dm.roles.add(campaignRole);
            console.log('assigned roles to dm');
        }

        const annexRole = await guild.roles.fetch(config.roles.annex);

        const overwriteOptions = {
            everyone: {
                userOrRole: guild.roles.everyone,
                type: OverwriteType.Role
            },
            players: {
                userOrRole: campaignRole,
                type: OverwriteType.Role
            },
            dm: {
                userOrRole: dm,
                type: OverwriteType.Member
            },
            staff: {
                userOrRole: annexRole,
                type: OverwriteType.Role
            }
        }

        if (!category) {
            category = await findOrCreateChannel(guild, {
                name: title,
                type: ChannelType.GuildCategory
            });
            console.log('no category provided, retrieved', category.name);
        }

        await overwritePermissionsProgressively(
            category,
            normalizePermissionOverwrites(channelDefinitions.category.permissionOverwrites, overwriteOptions)
        );

        console.log('updated category');

        const flatDefinitions = [];
        if (channelDefinitions.text) {
            for (const channel of channelDefinitions.text) {
                channel.name = [transformedLabel, channel.name].join('-');
                channel.type = ChannelType.GuildText;
            }
            flatDefinitions.push(...channelDefinitions.text);
        }
        if (channelDefinitions.voice) {
            for (const channel of channelDefinitions.voice) {
                channel.name = [label, channel.name].join(' ');
                channel.type = ChannelType.GuildVoice;
            }
            flatDefinitions.push(...channelDefinitions.voice);
        }

        const createdChannels = [];
        for (const channelDefinition of flatDefinitions) {
            const permissions = channelDefinition.permissionOverwrites;
            delete channelDefinition.permissionOverwrites;
            const channel = await findOrCreateChannel(guild, {
                ...channelDefinition,
                parent: category.id
            });
            await channel.lockPermissions();
            console.log('locked channel permissions');
            if (permissions) {
                await overwritePermissionsProgressively(
                    channel,
                    normalizePermissionOverwrites(permissions, overwriteOptions)
                );
                console.log('overwrote permissions');
            }
            createdChannels.push(channel);
        }

        this.interaction.editReply({
            ephemeral: true,
            content: `:tada: Woot! A new campaign! Check out <#${createdChannels[0].id}>`
        });
    }

    async getOptions() {
        const { guild } = this.interaction;
    
        const split = this.interaction.message.content.split('`');
        const title = split[1];
        const label = split[3].replace('@', '');
        const transformedLabel = transformLabel(label);
        const color = split[5];
        const category = split.length > 10 ? getCategoryByNameOrId(guild, split[7]) : null;
        const dm = await getMember(guild, this.interaction.message.content.match(/<@[!]?([^>]+)>/)[1]);
    
        return { dm, title, label, transformedLabel, color, category };
    }
}

function transformLabel(label) {
    return label.toLowerCase().replace(/\ /g, '-');
}