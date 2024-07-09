import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  Message,
  TextChannel,
} from 'discord.js';
import { unlinkSync, writeFileSync } from 'fs';

function getTimeStamp(unixTimeStamp: number) {
  return new Date(unixTimeStamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    timeZoneName: 'short',
    timeZone: 'UTC',
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('The command that handles everything to do with tickets')
  .setDMPermission(false)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('open')
      .setDescription('Open a ticket')
      .addStringOption((option) => option.setName('reason').setDescription('The reason for opening a ticket'))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('close')
      .setDescription('Close a ticket')
      .addStringOption((option) => option.setName('reason').setDescription('The reason for closing a ticket'))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Add a user to a ticket')
      .addUserOption((option) =>
        option.setName('user').setDescription('The user you want to add to this ticket').setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('remove a user to a ticket')
      .addUserOption((option) =>
        option.setName('user').setDescription('The user you want to remove from this ticket').setRequired(true)
      )
  );

const permissions = [
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.UseExternalEmojis,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.EmbedLinks,
];

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    const subCommand = interaction.options.getSubcommand();
    if (!interaction.channel) return;
    if (interaction.channel.type !== ChannelType.GuildText) return;
    if (!interaction.guild) return;
    await interaction.deferReply({ ephemeral: false });
    switch (subCommand) {
      case 'open': {
        const reason = interaction.options?.getString('reason') ?? 'No Reason Provided';

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: '1260189257595748383',
          permissionOverwrites: [
            { id: interaction.user.id, allow: permissions },
            { id: interaction.client.user.id, allow: permissions },
            { id: interaction.guild.roles.everyone.id, deny: permissions },
          ],
        });

        const ticketEmbed = new EmbedBuilder()
          .setColor(2067276)
          .setTitle('Ticket Opened')
          .setDescription(`Ticket opened by <@${interaction.user.id}>\n\nReason: ${reason}`)
          .setFooter({
            text: `by @kathund. | /help [command] for more information`,
            iconURL: 'https://i.imgur.com/uUuZx2E.png',
          });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setLabel('Close Ticket').setCustomId(`t.c.${channel.id}`).setStyle(ButtonStyle.Danger)
        );

        const openMessage = await channel.send({
          content: `<@${interaction.user.id}> | ${reason}`,
          embeds: [ticketEmbed],
          components: [row],
        });
        await channel.send({ content: '<@&1260144562890866728>' });

        await delay(500);
        await openMessage.pin();

        return await interaction.followUp('Ticket opened');
      }
      case 'close': {
        const closeReason = interaction.options?.getString('reason') ?? 'No Reason Provided';
        if (!interaction.channel.name.toLowerCase().startsWith('ticket-')) {
          await interaction.followUp({ content: 'This is not a ticket channel' });
        }

        let messages: Message[] = [];
        let lastMessageId = null;

        let shouldContinue = true;
        do {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fetchedMessages: any = await interaction.channel.messages.fetch({ limit: 100, before: lastMessageId });
          if (fetchedMessages.size === 0) {
            shouldContinue = false;
            break;
          }

          fetchedMessages.forEach((msg: Message) => messages.push(msg));
          lastMessageId = fetchedMessages.last().id;
        } while (shouldContinue);

        messages = messages
          .filter((msg) => !msg.author.bot || msg.author.id === interaction.client.user.id)
          .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        let TranscriptString = '';
        messages.forEach((msg) => {
          TranscriptString += `[${getTimeStamp(msg.createdTimestamp)}] | @${msg.author.username} (${msg.author.id}) | ${
            msg.content
          }\n`;
        });

        writeFileSync(`data/transcript-${interaction.channel.name}.txt`, TranscriptString);

        const firstMessage = (await interaction.channel.messages.fetchPinned()).first();
        if (!firstMessage) return;
        const openTimestamp = Math.floor(firstMessage.createdTimestamp / 1000);
        let openReason = 'No Reason Provided';
        if (firstMessage.content.includes(' | ')) {
          openReason = firstMessage.content.split(' | ')[1];
        }
        const closeTimestamp = Math.floor(Date.now() / 1000);
        const ticketOwnerId = firstMessage.mentions.users.first()?.id;
        const ticketLogsChannel = interaction.client.channels.cache.get('1260176059387871272') as TextChannel;

        const ticketCloseEmbed = new EmbedBuilder()
          .setColor(3447003)
          .setTitle('Ticket Closed')
          .addFields(
            {
              name: 'Ticket Open',
              value: `by: <@${ticketOwnerId}>\nTimestamp: <t:${openTimestamp}> (<t:${openTimestamp}:R>)\nReason: ${openReason}`,
            },
            {
              name: 'Ticket Closed',
              value: `by: <@${interaction.user.id}>\nTimestamp: <t:${closeTimestamp}> (<t:${closeTimestamp}:R>)\nReason: ${closeReason}`,
            }
          )
          .setFooter({
            text: `by @kathund. | /help [command] for more information`,
            iconURL: 'https://i.imgur.com/uUuZx2E.png',
          });

        ticketLogsChannel.send({
          embeds: [ticketCloseEmbed],
          files: [`data/transcript-${interaction.channel.name}.txt`],
        });

        try {
          await interaction.client.users.send(`${ticketOwnerId}`, {
            embeds: [ticketCloseEmbed],
            files: [`data/transcript-${interaction.channel.name}.txt`],
          });
        } catch (e) {
          await interaction.followUp({ content: 'User has DMs disabled' });
        }

        unlinkSync(`data/transcript-${interaction.channel.name}.txt`);

        await interaction.followUp({ content: 'Ticket Closed' });
        return await interaction.channel.delete();
      }
      case 'add': {
        const user = interaction.options.getUser('user');
        if (!user) return;
        if (!interaction.channel.name.toLowerCase().startsWith('ticket-')) {
          return await interaction.followUp({ content: 'This is not a ticket channel' });
        }

        const firstMessage = (await interaction.channel.messages.fetchPinned()).first();
        if (!firstMessage) return;
        const ticketOwnerId = firstMessage.mentions.users.first()?.id;

        if (user.id === ticketOwnerId) {
          return await interaction.followUp({ content: 'You cannot add the ticket owner to the ticket' });
        }

        const channelPermissions = [
          {
            id: `${user.id}`,
            allow: permissions,
          },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interaction.channel.permissionOverwrites.cache.forEach((value: any, key) => {
          if (key === user.id) return;
          channelPermissions.push(value);
        });

        await interaction.channel.permissionOverwrites.set(channelPermissions);

        return await interaction.followUp({
          content: `<@${user.id}> has been added to this ticket by <@${interaction.user.id}>`,
        });
      }
      case 'remove': {
        const user = interaction.options.getUser('user');
        if (!user) return;
        if (!interaction.channel.name.toLowerCase().startsWith('ticket-')) {
          return await interaction.followUp({ content: 'This is not a ticket channel' });
        }

        const firstMessage = (await interaction.channel.messages.fetchPinned()).first();
        if (!firstMessage) return;
        const ticketOwnerId = firstMessage.mentions.users.first()?.id;

        if (user.id === ticketOwnerId) {
          return await interaction.followUp({ content: 'You cannot remove the ticket owner from the ticket' });
        }

        const channelPermissions = [
          {
            id: `${user.id}`,
            deny: permissions,
          },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interaction.channel.permissionOverwrites.cache.forEach((value: any, key) => {
          if (key === user.id) return;
          channelPermissions.push(value);
        });

        await interaction.channel.permissionOverwrites.set(channelPermissions);

        return await interaction.followUp({
          content: `<@${user.id}> has been removed from this ticket by <@${interaction.user.id}>`,
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};
