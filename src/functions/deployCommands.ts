import { Client, Collection, REST, Routes } from 'discord.js';
import { eventMessage } from './logger';
import { SlashCommand } from '../types/main';
import { token } from '../../config.json';
import { readdirSync } from 'fs';

export const deployCommands = async (client: Client) => {
  try {
    client.commands = new Collection<string, SlashCommand>();
    const commandFiles = readdirSync('./src/commands');
    const commands = [];
    for (const file of commandFiles) {
      const command = await import(`../commands/${file}`);
      commands.push(command.data.toJSON());
      if (command.data.name) {
        client.commands.set(command.data.name, command);
      }
    }
    const rest = new REST({ version: '10' }).setToken(token);
    (async () => {
      try {
        await rest.put(Routes.applicationCommands(Buffer.from(token.split('.')[0], 'base64').toString('ascii')), {
          body: commands,
        });
        eventMessage(`Successfully reloaded ${commands.length} application command(s).`);
      } catch (error) {
        console.log(error);
      }
    })();
  } catch (error) {
    console.log(error);
  }
};
