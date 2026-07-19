const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketyetkilisi')
    .setDescription('Ticketlara bakabilecek yetkili rolünü ayarlar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((option) =>
      option
        .setName('rol')
        .setDescription('Yetkili rolü')
        .setRequired(true)
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    const config = interaction.client.config;

    if (!config.ticketRoles) config.ticketRoles = {};
    config.ticketRoles[interaction.guildId] = role.id;

    interaction.client.db.writeJSON('config.json', config);
    interaction.client.config = config;

    await interaction.reply({
      content: `✅ Ticket yetkili rolü başarıyla <@&${role.id}> olarak ayarlandı.`,
      ephemeral: true,
    });
  },
};
