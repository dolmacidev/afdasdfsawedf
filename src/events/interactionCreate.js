const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  Colors,
} = require('discord.js');
const panelCmd = require('../commands/panel');

const CATEGORIES = panelCmd.CATEGORIES;
const CATEGORY_NAMES = panelCmd.CATEGORY_NAMES;
const CATEGORY_EMOJIS = panelCmd.CATEGORY_EMOJIS;

const COLOR_MAP = {
  kontrol: Colors.Blue,
  basvuru: Colors.Green,
  sikayet: Colors.Yellow,
  hilebildirim: Colors.Red,
  hileitiraz: Colors.Orange,
};

async function getTicketUserId(topic) {
  if (!topic) return null;
  for (const part of topic.split(' | ')) {
    if (part.startsWith('user:')) return part.replace('user:', '');
  }
  return null;
}

async function getClaimedUserId(topic) {
  if (!topic) return null;
  for (const part of topic.split(' | ')) {
    if (part.startsWith('claimed:')) return part.replace('claimed:', '');
  }
  return null;
}

module.exports = async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmds = require('../commands');
    const cmd = cmds.find((c) => c.data.name === interaction.commandName);
    if (cmd) {
      try {
        await cmd.execute(interaction);
      } catch (err) {
        console.error(`Error executing ${interaction.commandName}:`, err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'Bir hata oluştu.',
            ephemeral: true,
          });
        }
      }
    }
    return;
  }

  if (!interaction.isButton()) return;

  const { customId, guild, member, channel } = interaction;

  if (customId.startsWith('ticket_open_')) {
    const categoryKey = customId.replace('ticket_open_', '');
    const categoryId = CATEGORIES[categoryKey];

    if (!categoryId) {
      return interaction.reply({
        content: 'Geçersiz kategori.',
        ephemeral: true,
      });
    }

    const existing = guild.channels.cache.filter(
      (c) =>
        c.type === ChannelType.GuildText &&
        c.parentId === categoryId &&
        c.topic &&
        c.topic.includes(`user:${member.id}`)
    );
    if (existing.size > 0) {
      return interaction.reply({
        content: `Bu kategoride zaten açık bir ticketınız var: ${existing.first().toString()}`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const config = interaction.client.config;
      const staffRoleId = config.ticketRoles?.[guild.id] || null;

      const safeName = member.user.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const channelName = `${categoryKey}-${safeName}-${Date.now().toString(36)}`;

      const perms = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
      ];
      if (staffRoleId) {
        perms.push({
          id: staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
          ],
          deny: [PermissionFlagsBits.SendMessages],
        });
      }

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        topic: `user:${member.id} | category:${categoryKey} | status:açık`,
        permissionOverwrites: perms,
      });

      const openEmbed = new EmbedBuilder()
        .setColor(COLOR_MAP[categoryKey] || Colors.Blurple)
        .setAuthor({
          name: `${member.user.username} tarafından açıldı`,
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setTitle(
          `${CATEGORY_EMOJIS[categoryKey]} ${CATEGORY_NAMES[categoryKey]} Ticketi`
        )
        .setDescription(
          `Hoş geldiniz ${member}! Ekibimiz en kısa sürede size yardımcı olacaktır.\n\n` +
            `**Kategori:** ${CATEGORY_NAMES[categoryKey]}\n` +
            `**Ticket ID:** \`${ticketChannel.id}\``
        )
        .setFooter({
          text: 'Development by dethrxn • discord.gg/craftfrostia',
        })
        .setTimestamp();

      const claimRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_claim_${ticketChannel.id}`)
          .setLabel('Üstlen')
          .setEmoji('🙋')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`ticket_close_${ticketChannel.id}`)
          .setLabel('Kapat')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: staffRoleId ? `<@&${staffRoleId}>` : '',
        embeds: [openEmbed],
        components: [claimRow],
      });

      await interaction.editReply({
        content: `✅ Ticket başarıyla oluşturuldu: ${ticketChannel.toString()}`,
      });
    } catch (err) {
      console.error('Ticket creation error:', err);
      await interaction.editReply({
        content: 'Ticket oluşturulurken bir hata oluştu.',
      });
    }
    return;
  }

  if (customId.startsWith('ticket_claim_')) {
    const ticketChannelId = customId.replace('ticket_claim_', '');
    const ticketChannel = guild.channels.cache.get(ticketChannelId);

    if (!ticketChannel) {
      return interaction.reply({
        content: 'Bu ticket kanalı bulunamadı.',
        ephemeral: true,
      });
    }

    if (ticketChannel.topic?.includes('status:kapalı')) {
      return interaction.reply({
        content: 'Bu ticket zaten kapatılmış.',
        ephemeral: true,
      });
    }

    const alreadyClaimed = await getClaimedUserId(ticketChannel.topic);
    if (alreadyClaimed) {
      const claimer = await guild.members.fetch(alreadyClaimed).catch(() => null);
      return interaction.reply({
        content: `Bu ticket zaten ${claimer || 'bir yetkili'} tarafından üstlenilmiş.`,
        ephemeral: true,
      });
    }

    const config = interaction.client.config;
    const staffRoleId = config.ticketRoles?.[guild.id] || null;

    if (staffRoleId && !member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: 'Bu ticketi üstlenme yetkiniz yok.',
        ephemeral: true,
      });
    }

    const ticketUserId = await getTicketUserId(ticketChannel.topic);

    const allMsgs = await ticketChannel.messages.fetch({ limit: 50 });
    const openMsg = allMsgs.find((m) =>
      m.components.some((row) =>
        row.components.some(
          (b) => b.customId === `ticket_claim_${ticketChannelId}`
        )
      )
    );

    if (openMsg) {
      await openMsg.edit({ components: [] });
    }

    await ticketChannel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    });

    if (staffRoleId) {
      const staffMembers = guild.roles.cache
        .get(staffRoleId)
        .members.filter((m) => !m.user.bot && m.id !== member.id);

      for (const sMember of staffMembers.values()) {
        await ticketChannel.permissionOverwrites
          .edit(sMember.id, { SendMessages: false })
          .catch(() => {});
      }
    }

    if (ticketUserId && ticketUserId !== member.id) {
      await ticketChannel.permissionOverwrites.edit(ticketUserId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true,
      });
    }

    const claimEmbed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(`🙋 **${member}** bu ticketi üstlendi.`)
      .setFooter({
        text: 'Development by dethrxn • discord.gg/craftfrostia',
      });

    await ticketChannel.send({ embeds: [claimEmbed] });

    const claims = interaction.client.db.readJSON('claims.json');
    if (!claims[guild.id]) claims[guild.id] = {};
    claims[guild.id][member.id] = (claims[guild.id][member.id] || 0) + 1;
    interaction.client.db.writeJSON('claims.json', claims);

    await ticketChannel.setTopic(
      `${ticketChannel.topic} | claimed:${member.id}`
    );

    await interaction.reply({
      content: `✅ Ticket başarıyla üstlenildi: ${ticketChannel.toString()}`,
      ephemeral: true,
    });
    return;
  }

  if (customId.startsWith('ticket_close_')) {
    const ticketChannelId = customId.replace('ticket_close_', '');
    const ticketChannel = guild.channels.cache.get(ticketChannelId);

    if (!ticketChannel) {
      return interaction.reply({
        content: 'Bu ticket kanalı bulunamadı.',
        ephemeral: true,
      });
    }

    const closeEmbed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setTitle('🔒 Ticket Kapatılıyor')
      .setDescription('Ticket 5 saniye içinde kapatılacak.')
      .setFooter({
        text: 'Development by dethrxn • discord.gg/craftfrostia',
      });

    await interaction.reply({ embeds: [closeEmbed] });

    setTimeout(async () => {
      try {
        await ticketChannel.delete();
      } catch (err) {
        console.error('Failed to delete channel:', err);
      }
    }, 5000);
    return;
  }
};
