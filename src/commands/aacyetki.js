const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aacyetki')
    .setDescription('AAC komutlarını (/kontrol) kullanabilecek rolü ayarlar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((opt) =>
      opt.setName('rol')
        .setDescription('Yetkili rolü')
        .setRequired(true)
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('rol');
    const config = interaction.client.config;

    if (!config.aacRoles) config.aacRoles = {};
    config.aacRoles[interaction.guildId] = role.id;

    interaction.client.db.writeJSON('config.json', config);
    interaction.client.config = config;

    await interaction.reply({
      content: `✅ AAC komutlarını kullanabilecek rol <@&${role.id}> olarak ayarlandı.`,
      ephemeral: true,
    });
  },
};
