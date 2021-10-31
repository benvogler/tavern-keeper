# Tavern Keeper

## Setup

1. Create config.json
2. Enter app id as "clientId", bot token as "token", server id as "guildId"
3. Add the bot to your server: https://discord.com/api/oauth2/authorize?client_id=904416530782113874&permissions=8&scope=bot%20applications.commands
4. Deploy the bot's commands (only necessary once at setup and each time you update the bot) by running `npm run deploy-commands`
5. Run the bot using `npm start`. This must be running at all times for the commands to work.