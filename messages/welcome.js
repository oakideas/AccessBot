const { EmbedBuilder, ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = (member) => {

  const btOpenLogin = new ButtonBuilder({
    custom_id: 'btOpenLogin',
    label: 'LIBERAR MEU ACESSO',
    style: ButtonStyle.Primary
  });
  
  const row1 = new ActionRowBuilder().addComponents([ btOpenLogin ]);
  
  const welcomeMessage = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Bem vindo a nossa comunidade `)
    .setDescription(`${member.user}, aperte o botão abaixo para confirmar seu e-mail e liberar seu acesso!`);

  return { embeds: [ welcomeMessage ], components: [row1] };
};
