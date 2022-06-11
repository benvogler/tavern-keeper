import { ApplicationCommandOptionType } from 'discord-api-types/v9';

export class Command {

    interaction;
    client;

    definition;
    allowedRolesOrUsers;
    
    /**
     * Command options passed by user
     */
    options;
    
    constructor(interaction, client, definition, allowedRolesOrUsers) {
        this.interaction = interaction;
        this.client = client;
        this.definition = definition;
        this.allowedRolesOrUsers = allowedRolesOrUsers;
        this.options = this.parseCommandOptions();
    }

    /**
     * Execute the command using the given interaction
     * @abstract
     * @throws {CommandAuthorizationError}
     */
    async execute() {
        throw new Error('must be implemented by subclass');
    }

    /**
     * Check if the executing user has permission to run this command
     * @abstract
     * @return {Boolean}
     */
    checkPermission() {
        if (this.allowedRolesOrUsers) {
            const roleIds = this.interaction.member.roles.cache.map(role => role.id);
            if (!this.allowedRolesOrUsers.includes(this.interaction.member.id) &&
                !this.allowedRolesOrUsers.some(item => roleIds.includes(item))) {
                throw new CommandAuthorizationError();
            }
        } else {
            throw new Error('must be implemented by subclass');
        }
    }

    parseCommandOptions() {
        if (!this.definition?.options?.length) {
            return {};
        }
        const options = {};
        for (const option of this.definition.options) {
            for (const type in ApplicationCommandOptionType) {
                if (option.type === ApplicationCommandOptionType[type]) {
                    options[option.name] = this.interaction.options['get' + type](option.name);
                }
            }
        }
        return options;
    }
}

export class CommandAuthorizationError extends Error {
    constructor(message) {
        super(message || `Sorry, you don't have permission to do that.`);
        this.name = 'CommandAuthorizationError';
    }
}