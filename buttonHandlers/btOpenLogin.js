const modalLogin = require('../dialogs/modalLogin.js');

module.exports = {
  cooldown: 5,
  customId: 'btOpenLogin',
  async execute(interaction) {
    modalLogin.show(interaction);
  },
};