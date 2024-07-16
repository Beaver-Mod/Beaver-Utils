import { deployEvents } from '../functions/deployEvents';
import { eventMessage } from '../functions/logger';
import { Client } from 'discord.js';

export const execute = (client: Client) => {
  try {
    eventMessage(`Logged in as ${client.user?.username} (${client.user?.id})!`);
    deployEvents(client);
    client.user?.setActivity('Beaver')
  } catch (error) {
    console.log(error);
  }
};
