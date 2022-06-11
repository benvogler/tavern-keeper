import { ChannelType, OverwriteType, ApplicationCommandOptionType } from 'discord-api-types/v9';
import { MessageActionRow, MessageButton } from 'discord.js';

import { Command } from '../lib/command.js';
import { findOrCreateChannel, normalizePermissionOverwrites, overwritePermissionsProgressively, getCategoryByNameOrId, getMember } from '../utils.js';
import { commandOptions } from '../config.js';
const config = commandOptions.createoneshot;

export const CreateOneshotDefinition = {
    name: 'createoneshot',
    description: 'Creates a channel for a new one-shot!',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'label',
            description: 'The name of the one-shot. Used for the channel name.',
            required: true
        },
        {
            type: ApplicationCommandOptionType.User,
            name: 'dm',
            description: `The User who is the DM of the one-shot. You can leave this blank if it's you!`
        }
    ]
}

export class CreateOneshot extends Command {

    static definition = CreateOneshotDefinition;
    static allowedRolesOrUsers = config.allowedRolesOrUsers;

    constructor(interaction, client) {
        super(interaction, client, CreateOneshot.definition, CreateOneshot.allowedRolesOrUsers);
        this.options = this.transformOptions();
    }

    async execute() {

        const { dm, label } = this.options;

        console.log(`Creating a one-shot titled ${label} for DM ${dm}`);
    
        this.interaction.reply({
            ephemeral: true,
            content: `You're about to create the one-shot \`${label}\` with the DM ${dm}. Are you sure you want to continue?`,
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(ConfirmCreateOneshot.definition.name)
                            .setLabel('Send it!')
                            .setStyle('PRIMARY')
                    )
            ]
        });
    }

    transformOptions() {
        let { dm, label } = this.options;
        if (!dm) {
            dm = this.interaction.member;
        }
        return { dm, label, transformedLabel: transformLabel(label) };
    }
}


export const ConfirmCreateOneshotDefinition = {
    name: 'confirmcreateoneshot'
};

export class ConfirmCreateOneshot extends Command {

    static definition = ConfirmCreateOneshotDefinition;
    static allowedRolesOrUsers = config.allowedRolesOrUsers;

    constructor(interaction, client) {
        super(interaction, client, ConfirmCreateOneshot.definition, ConfirmCreateOneshot.allowedRolesOrUsers);
    }

    async execute() {

        const { guild } = this.interaction;
        let { dm, label, transformedLabel } = await this.getOptions();
        const channelDefinitions = JSON.parse(JSON.stringify(config.channels));
        const category = getCategoryByNameOrId(guild, config.category);

        this.interaction.deferReply({ephemeral: true});

        const overwriteOptions = {
            dm: {
                userOrRole: dm,
                type: OverwriteType.Member
            }
        }

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
            content: `:tada: Woot! A new one-shot! Check out <#${createdChannels[0].id}>`
        });
    }

    async getOptions() {
        const { guild } = this.interaction;
    
        const split = this.interaction.message.content.split('`');
        const label = split[1];
        const dm = await getMember(guild, this.interaction.message.content.match(/<@[!]?([^>]+)>/)[1]);
    
        return { dm, label, transformedLabel: transformLabel(label) };
    }
}


function transformLabel(label) {
    return label.toLowerCase().replace(/\ /g, '-');
}