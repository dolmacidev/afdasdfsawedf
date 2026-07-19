const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const CATEGORIES = {
  kontrol: '1528358670080151723',
  basvuru: '1528358672739209296',
  sikayet: '1528358677034176512',
  hilebildirim: '1528358679051767829',
  hileitiraz: '1528358710789804203',
};

const CATEGORY_NAMES = {
  kontrol: 'Kontrol',
  basvuru: 'Başvuru',
  sikayet: 'Şikayet',
  hilebildirim: 'Hile Bildirimi',
  hileitiraz: 'Hile İtiraz',
};

const CATEGORY_EMOJIS = {
  kontrol: '🔍',
  basvuru: '📋',
  sikayet: '⚠️',
  hilebildirim: '🚫',
  hileitiraz: '🔄',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Ticket panelini gönderir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('🎫 Ticket Sistemi')
      .setDescription(
        'Aşağıdaki butonlardan size uygun olan kategoriyi seçerek ticket açabilirsiniz.\n\n' +
          Object.entries(CATEGORIES)
            .map(([key]) => `${CATEGORY_EMOJIS[key]} **${CATEGORY_NAMES[key]}**`)
            .join('\n')
      )
      .setFooter({
        text: 'Development by dethrxn • discord.gg/craftfrostia',
      });

    const row = new ActionRowBuilder().addComponents(
      Object.entries(CATEGORIES).map(([key, id]) =>
        new ButtonBuilder()
          .setCustomId(`ticket_open_${key}`)
          .setEmoji(CATEGORY_EMOJIS[key])
          .setLabel(CATEGORY_NAMES[key])
          .setStyle(ButtonStyle.Secondary)
      )
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
  CATEGORIES,
  CATEGORY_NAMES,
  CATEGORY_EMOJIS,
};
