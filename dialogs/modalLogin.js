const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const Airtable = require('airtable');

const customId = 'modalLogin';

const field_email = process.env['FIELD_EMAIL'];
const field_id = process.env['FIELD_ID'];
const field_status = process.env['FIELD_STATUS'];
const field_discord_customer_id = process.env['FIELD_DISCORD_CUSTOMER_ID'];

const value_active = process.env['VALUE_ACTIVE'];
const value_inactive = process.env['VALUE_INACTIVE'];

const validateEmail = (email) => {
    // RFC 2822 compliant regex
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(String(email).toLowerCase());
}

module.exports = {
  cooldown: 5,
  customId: customId,
  async show(interaction) {
    const modal = new ModalBuilder({
      custom_id: customId,
      title: 'Ative sua conta'
    });

    const txtEmail = new TextInputBuilder({
      custom_id: 'txtEmail',
      label: 'Informe o e-mail utilizado no HOTMART.',
      style: TextInputStyle.Short
    });

    modal.addComponents(new ActionRowBuilder().addComponents(txtEmail));

    await interaction.showModal(modal);

    //Esta seria outra forma de fazer. para usar esta abordagem o método handle não pode
    //ser mais processado pelo index.
    // const filter = (interaction) => interaction.customId === customId;
    // interaction.awaitModalSubmit({
    //   filter, time: 30_000
    // }).then(this.handle)
    //.catch((err) => {
    //   console.log(`Error ${err}`);
    // });
    
  },
  async handle(interaction) {
    // console.log(interaction);
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply('Processando...');

    const email = interaction.fields?.getTextInputValue('txtEmail');

    if (!validateEmail(email)) {
      await interaction.editReply('Email inválido!');
      return;
    }

    var base = new Airtable({
      apiKey: process.env['DATA_AIRTABLE_TOKEN']
    }).base(process.env['DATA_AIRTABLE_BASE']);

    base(process.env['DATA_AIRTABLE_TABLE']).select({
      fields: [field_id, field_email, field_status, field_discord_customer_id],
      filterByFormula: `${field_email} = "${email}"`,
      maxRecords: 1
    }).firstPage(async function(err, records) {
      if (err) { console.error(err); return; }

      if (records.length === 0) {
        console.log('not found');
        await interaction.editReply('Não encontramos nenhum registro com seu e-mail!');
        return;
      } else {
        const record = records[0];
        console.log('Encontrado', record.id, record.get(field_email), record.get(field_status));

        if (record.get(field_status) !== value_active) {
          await interaction.editReply('Esta conta está inativa, entre em com nosso suporte!');
          return;
        }

        const role = interaction.guild.roles.cache.find(r => r.name === process.env['CUSTOMER_ACTIVE_ROLE']);
        if (!role) {
          console.log('The role "Member" does not exist in this guild.')
          await interaction.editReply('Ocorreu um erro em nosso sistema, entre em contato com nosso suporte!');
          return;
        }
        
        const user_id = record.get(field_discord_customer_id);
        if (user_id != '' &&  user_id != interaction.user.id) {
          //remove o acesso do usuário antigo.

          let member = null;
          await interaction.guild.members.fetch(user_id).then((data) => {
            member = data;
          }).catch((error) => console.log(error));

          if (member) {
            console.log('removendo acesso de ', user_id);
            await member.roles.remove(role);
          }
        }

        // console.log(interaction);

        const member = interaction.member;
        await member.roles.add(role);

        base(process.env['DATA_AIRTABLE_TABLE']).update([
          {
            "id": record.id,
            "fields": {
              [field_discord_customer_id]: interaction.user.id
            }
          }
        ], async function(err, records) {
          if (err) {
            console.error(err);
            await interaction.editReply('Ocorreu um erro processando sua solicitação!');
            return;
          }
          
          await interaction.editReply('Pronto!');
        });
      }
    });
    
  },
};