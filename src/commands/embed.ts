import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { buttons } from '../functions/embed';

export const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('The command that handles everything to do with tickets')
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addStringOption((option) =>
    option.setName('message-import').setDescription('Import a message to edit | Only discord links').setRequired(false)
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    let messageImport = interaction.options.getString('message-import') || null;

    let content = '';
    const embeds: EmbedBuilder[] = [];
    const files = [];

    if (messageImport) {
      if (!messageImport) {
        return await interaction.followUp({ content: 'Please provoid a message link' });
      }
      if (!messageImport.includes('https://')) {
        return await interaction.followUp({ content: 'Invalid message link' });
      }
      if (messageImport.startsWith('https://canary.discord.com')) {
        messageImport = messageImport.replace('canary.', '');
      }
      if (messageImport.startsWith('https://ptb.discord.com')) {
        messageImport = messageImport.replace('ptb.', '');
      }
      if (!messageImport.startsWith('https://discord.com/channels/')) {
        return await interaction.followUp({ content: 'Invalid message link | Link must be a discord message link' });
      }
      const messageLinkSplit = messageImport.split('/');
      const messageId = messageLinkSplit.pop() as string;
      const channelId = messageLinkSplit.pop() as string;
      const channel = (await interaction.client.channels.fetch(channelId)) as TextChannel;
      const message = await channel.messages.fetch(messageId);
      content = message.content;
      message.embeds.forEach((embed) => embeds.push(new EmbedBuilder(embed.toJSON())));
    }

    if (embeds.length === 0) {
      buttons.editEmbed.setDisabled(true);
      buttons.deleteEmbed.setDisabled(true);
    }
    if (files.length === 0) {
      buttons.deleteImage.setDisabled(true);
    }

    await interaction.reply({
      content,
      embeds,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.editMessage, buttons.addImage, buttons.deleteImage),
        new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.addEmbed, buttons.editEmbed, buttons.deleteEmbed),
        new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.importJson, buttons.exportJson),
        new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.reset, buttons.send),
      ],
      ephemeral: true,
    });
  } catch (error) {
    console.log(error);
  }
};
