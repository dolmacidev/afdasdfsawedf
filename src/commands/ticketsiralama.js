const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsiralama')
    .setDescription('Yetkililerin üstlendiği/kapattığı ticket sıralamasını gösterir')
    .addStringOption((opt) =>
      opt.setName('tür')
        .setDescription('Sıralama türü')
        .setRequired(true)
        .addChoices(
          { name: 'Üstlenme', value: 'claim' },
          { name: 'Kapatma', value: 'close' }
        )
    ),
  async execute(interaction) {
    const tur = interaction.options.getString('tür');
    const data = interaction.client.db.readJSON(tur === 'claim' ? 'claims.json' : 'closes.json');
    const guildData = data[interaction.guildId] || {};

    const sorted = Object.entries(guildData)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      return interaction.reply({
        content: `Henüz hiç ticket ${tur === 'claim' ? 'üstlenilmemiş' : 'kapatılmamış'}.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(tur === 'claim' ? '🙋 Ticket Üstlenme Sıralaması' : '🔒 Ticket Kapatma Sıralaması')
      .setDescription(
        sorted
          .slice(0, 15)
          .map(
            (entry, i) =>
              `${i + 1}. <@${entry.userId}> — **${entry.count}** ticket`
          )
          .join('\n')
      )
      .setFooter({ text: 'discord.gg/craftfrostia' });

    await interaction.reply({ embeds: [embed] });
  },
};
