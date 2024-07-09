import { Collection, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord';

export interface SlashCommand {
  command: SlashCommandBuilder | any;
  execute: (interaction: ChatInputCommandInteraction) => void;
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, SlashCommand>;
  }
}
