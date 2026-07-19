const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { readJSON, writeJSON } = require('./database');
const config = readJSON('config.json') || {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.config = config;
client.db = { readJSON, writeJSON };

client.once('ready', require('./events/ready'));
client.on('interactionCreate', require('./events/interactionCreate'));

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('DISCORD_TOKEN environment variable is not set!');
  process.exit(1);
}

client.login(token);
