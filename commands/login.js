const { SlashCommandBuilder } = require("discord.js");
const welcome = require('../messages/welcome.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("login")
    .setDescription("Ativa seu acesso ao nosso canal"),
  async execute(interaction) {

    // console.log(interaction);

    const message = welcome(interaction.member);

    await interaction.reply(message);
    // await interaction.reply('login received');
  }
}