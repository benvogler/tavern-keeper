# Tavern Keeper

## Setup

1. Run `npm install`. If you don't have npm, [install it](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
2. Create config.json
3. Enter app id as "clientId", bot token as "token", server id as "guildId"
4. Add the bot to your server by clicking [here](https://discord.com/api/oauth2/authorize?client_id=904416530782113874&permissions=8&scope=bot%20applications.commands)
5. Deploy the bot's commands (only necessary once at setup and each time you update the bot) by running `npm run deploy-commands`
6. Run the bot using `npm start`. This must be running at all times for the commands to work.