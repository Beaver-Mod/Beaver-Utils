import { deployCommands } from './src/functions/deployCommands';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { execute } from './src/events/ready';
import { token } from './config.json';

const client = new Client({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.Guilds,
  ],
});

deployCommands(client);

client.on(Events.ClientReady, () => {
  execute(client);
});

client.login(token);
