const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const { readJSON, writeJSON } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kapat')
    .setDescription('Ticketı zorla kapatır ve kanalı siler'),
  async execute(interaction) {
    const { channel, guild, member } = interaction;
    const topic = channel.topic;

    if (!topic || !topic.includes('user:')) {
      return interaction.reply({ content: '❌ Bu bir ticket kanalı değil.', ephemeral: true });
    }

    const claimedId = topic.includes('claimed:') ? topic.replace(/.*claimed:(\d+).*/, '$1') : null;

    const embed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setTitle('🔒 Ticket Kapatılıyor')
      .setDescription(`Ticket **${member.user.username}** tarafından kapatılıyor.`)
      .setFooter({ text: 'discord.gg/craftfrostia' });

    await interaction.reply({ embeds: [embed] });

    if (claimedId) {
      const closes = readJSON('closes.json');
      if (!closes[guild.id]) closes[guild.id] = {};
      closes[guild.id][member.id] = (closes[guild.id][member.id] || 0) + 1;
      writeJSON('closes.json', closes);
    }

    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (err) {
        console.error('Failed to delete channel:', err);
      }
    }, 3000);
  },
};
