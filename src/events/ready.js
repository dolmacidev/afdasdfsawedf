const { REST, Routes, ActivityType } = require('discord.js');
const commands = require('../commands');

module.exports = async (client) => {
  console.log(`Bot online: ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'discord.gg/craftfrostia', type: ActivityType.Custom }],
    status: 'dnd',
  });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands.map((cmd) => cmd.data.toJSON()),
    });
    console.log('Slash commands registered globally.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
};
