const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kont')
    .setDescription('Bir oyuncuya kont rolü verir')
    .addStringOption((opt) =>
      opt.setName('oyuncu')
        .setDescription('Minecraft oyuncu ismi')
        .setRequired(true)
    ),
  async execute(interaction) {
    const config = interaction.client.config;
    const kontRoleId = config.kontRoles?.[interaction.guildId];
    const member = interaction.member;

    if (kontRoleId && !member.roles.cache.has(kontRoleId) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok.', ephemeral: true });
    }

    const username = interaction.options.getString('oyuncu');
    const kontRole = '1528358655198629888';

    const embed = {
      color: 0x2b2d31,
      title: '✅ Kont İşlemi',
      description: `**${username}** adlı oyuncuya <@&${kontRole}> rolü verildi.`,
      fields: [
        { name: 'İşlemi Yapan', value: `${member}`, inline: true },
        { name: 'Oyuncu', value: `**${username}**`, inline: true },
      ],
      footer: { text: 'discord.gg/craftfrostia' },
      timestamp: new Date().toISOString(),
    };

    const channel = interaction.guild.channels.cache.get('1528358799067320372');
    if (channel) {
      await channel.send({ embeds: [embed] }).catch(() => {});
    }

    await interaction.reply({ content: `✅ **${username}** adlı oyuncuya <@&${kontRole}> rolü verildi.`, ephemeral: true });
  },
};
