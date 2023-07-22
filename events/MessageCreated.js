const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(interaction) {
    if (interaction.author.bot) return; //ignore bot messages
  
    console.log(`${interaction.author.tag}: ${interaction.content}`);
    // console.log(interaction);
    
    if (interaction.content === "ping") {
      interaction.reply("pong");
    }
  }
};
