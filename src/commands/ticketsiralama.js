const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsiralama')
    .setDescription('Yetkililerin üstlendiği ticket sayısını gösterir'),
  async execute(interaction) {
    const claims = interaction.client.db.readJSON('claims.json');
    const guildClaims = claims[interaction.guildId] || {};

    const sorted = Object.entries(guildClaims)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      return interaction.reply({
        content: 'Henüz hiç ticket üstlenilmemiş.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('📊 Ticket Sıralaması')
      .setDescription(
        sorted
          .slice(0, 15)
          .map(
            (entry, i) =>
              `${i + 1}. <@${entry.userId}> — **${entry.count}** ticket`
          )
          .join('\n')
      )
      .setFooter({
        text: 'Development by dethrxn • discord.gg/craftfrostia',
      });

    await interaction.reply({ embeds: [embed] });
  },
};
