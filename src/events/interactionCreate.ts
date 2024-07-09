import { eventMessage } from '../functions/logger';
import { Interaction } from 'discord.js';

export const execute = async (interaction: Interaction) => {
  try {
    if (!interaction.guild) return;
    if (!interaction.channel) return;
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        eventMessage(
          `Interaction Event trigged by ${interaction.user.username} (${interaction.user.id}) ran command ${interaction.commandName} in ${interaction.guild.id} in ${interaction.channel.id}`
        );
        await command.execute(interaction);
      } catch (error) {
        console.log(error);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Something went wrong', ephemeral: true });
        } else {
          await interaction.reply({ content: 'Something went wrong', ephemeral: true });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};
