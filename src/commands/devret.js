const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devret')
    .setDescription('Ticketı başka bir yetkiliye devreder')
    .addUserOption((opt) =>
      opt.setName('yetkili')
        .setDescription('Devredilecek yetkili')
        .setRequired(true)
    ),
  async execute(interaction) {
    const { channel, guild, member } = interaction;
    const topic = channel.topic;

    if (!topic || !topic.includes('claimed:')) {
      return interaction.reply({ content: '❌ Bu ticket üstlenilmemiş.', ephemeral: true });
    }

    const claimedId = topic.replace(/.*claimed:(\d+).*/, '$1');
    const config = interaction.client.config;
    const staffRoleId = config.ticketRoles?.[guild.id];

    if (member.id !== claimedId && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Sadece ticketi üstlenen kişi devredebilir.', ephemeral: true });
    }

    const newClaimer = interaction.options.getUser('yetkili');
    const newMember = await guild.members.fetch(newClaimer.id).catch(() => null);

    if (!newMember) {
      return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    }

    if (staffRoleId && !newMember.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: '❌ Bu kullanıcı yetkili değil.', ephemeral: true });
    }

    await channel.permissionOverwrites.edit(claimedId, { SendMessages: false, ViewChannel: true, ReadMessageHistory: true });
    await channel.permissionOverwrites.edit(newClaimer.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    });

    const newTopic = topic.replace(/claimed:\d+/, `claimed:${newClaimer.id}`);
    await channel.setTopic(newTopic);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setDescription(`🔄 **${member}** ticketı **${newClaimer}**'a devretti.`);

    await channel.send({ embeds: [embed] });

    await interaction.reply({ content: `✅ Ticket **${newClaimer.username}**'a devredildi.`, ephemeral: true });
  },
};
