const { Events, EmbedBuilder } = require('discord.js');
const welcome = require('../messages/welcome.js');

module.exports = {
	name: Events.GuildMemberAdd,
	once: false,
	async execute(member) {

    //ver https://www.youtube.com/watch?v=z9oy_HEL_YI
    const channel = member.client.channels.cache.find(channel => channel.id === process.env['WELCOME_CHANNEL_ID']);
    //console.log(channel);
    
    const message = welcome(member);
    await channel.send(message);
  
    // await welcomeEvent.run(member);
    //console.log(member);
  }
};
