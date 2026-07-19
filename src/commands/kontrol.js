const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  Colors,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kontrol')
    .setDescription('AAC kontrol işlemi yapar')
    .addStringOption((opt) =>
      opt.setName('oyuncu')
        .setDescription('Minecraft oyuncu ismi')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('durum')
        .setDescription('Kontrol sonucu')
        .setRequired(true)
        .addChoices(
          { name: '✅ Temiz', value: 'temiz' },
          { name: '❌ Kirli', value: 'kirli' }
        )
    )
    .addStringOption((opt) =>
      opt.setName('sebep')
        .setDescription('Kirli ise sebep (temizse boş bırakın)')
        .setRequired(false)
        .addChoices(
          { name: 'Hile Kullanımı', value: 'Hile Kullanımı' },
          { name: 'Yasaklı Mod Kullanımı', value: 'Yasaklı Mod Kullanımı' },
          { name: 'Konttan Kaçış', value: 'Konttan Kaçış' }
        )
    )
    .addAttachmentOption((opt) =>
      opt.setName('kanit')
        .setDescription('Kanıt dosyası (ekran görüntüsü/video)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const config = interaction.client.config;
    const aacRoleId = config.aacRoles?.[interaction.guildId];
    const member = interaction.member;

    if (aacRoleId && !member.roles.cache.has(aacRoleId) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok.', ephemeral: true });
    }

    const username = interaction.options.getString('oyuncu');
    const durum = interaction.options.getString('durum');
    const sebep = interaction.options.getString('sebep') || '—';
    const kanit = interaction.options.getAttachment('kanit');

    if (durum === 'kirli' && !interaction.options.getString('sebep')) {
      return interaction.reply({ content: '❌ Kirli işareti için sebep seçmelisiniz.', ephemeral: true });
    }

    const reportEmbed = new EmbedBuilder()
      .setColor(durum === 'temiz' ? Colors.Green : Colors.Red)
      .setAuthor({
        name: `${member.user.username} tarafından`,
        iconURL: member.user.displayAvatarURL({ dynamic: true }),
      })
      .setTitle(durum === 'temiz' ? '✅ AAC Kontrol — Temiz' : '❌ AAC Kontrol — Kirli')
      .addFields(
        { name: 'Oyuncu', value: `\`${username}\``, inline: true },
        { name: 'Durum', value: durum === 'temiz' ? '✅ Temiz' : '❌ Kirli', inline: true },
        { name: 'Sebep', value: sebep, inline: true },
      )
      .setImage(kanit && kanit.contentType?.startsWith('image/') ? kanit.url : null)
      .setFooter({ text: 'discord.gg/craftfrostia' })
      .setTimestamp();

    const reportChannel = interaction.guild.channels.cache.get('1528358799067320372');

    if (!reportChannel) {
      return interaction.reply({ content: '❌ Rapor kanalı bulunamadı.', ephemeral: true });
    }

    await reportChannel.send({
      embeds: [reportEmbed],
      content: kanit ? `**Kanıt:** ${kanit.url}` : null,
    });

    await interaction.reply({
      content: `✅ Kontrol raporu <#1528358799067320372> kanalına gönderildi.`,
      ephemeral: true,
    });
  },
};
