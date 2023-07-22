const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent]
});

client.commands = new Collection();
client.buttonHandlers = new Collection();
client.dialogs = new Collection();
client.cooldowns = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

const buttonHandlersPath = path.join(__dirname, 'buttonHandlers');
const buttonHandlersFiles = fs.readdirSync(buttonHandlersPath).filter(file => file.endsWith('.js'));
for (const file of buttonHandlersFiles) {
  const filePath = path.join(buttonHandlersPath, file);
  const buttonHandler = require(filePath);

  if ('customId' in buttonHandler && 'execute' in buttonHandler) {
    client.buttonHandlers.set(buttonHandler.customId, buttonHandler);
  } else {
    console.log(`[WARNING] The buttomHanlder at ${filePath} is missing a required "customId" or "execute" property.`);
  }
}

const dialogsPath = path.join(__dirname, 'dialogs');
const dialogsFiles = fs.readdirSync(dialogsPath).filter(file => file.endsWith('.js'));
for (const file of dialogsFiles) {
  const filePath = path.join(dialogsPath, file);
  const dialog = require(filePath);

  if ('customId' in dialog && 'show' in dialog && 'handle' in dialog) {
    client.dialogs.set(dialog.customId, dialog);
  } else {
    console.log(`[WARNING] The dialog at ${filePath} is missing a required "customId" or "show" or "handle" property.`);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const needCooldown = (cooldown, unique_id, interaction) => {
  if (!cooldown || cooldown <= 0) {
    return false;
  }

  if (!client.cooldowns.has(unique_id)) {
    client.cooldowns.set(unique_id, new Collection());
  }

  const now = Date.now();
  const timestamps = client.cooldowns.get(unique_id);

  const cooldownAmount = cooldown * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      interaction.reply({ content: `Não é possível concluir sua ação agora, aguarde alguns segundos e tente novamente! ( <t:${expiredTimestamp}:R>.)`, ephemeral: true });
      return true;
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  return false;
}

//Handle ChatInputCommand
client.on(Events.InteractionCreate, async interaction => {

  switch (true) {
    case interaction.isChatInputCommand():
      {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        if (needCooldown(command?.cooldown, command.data.name, interaction)) {
          return;
        }

        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Ocorreu um erro executando seu comando!', ephemeral: true });
          } else {
            await interaction.reply({ content: 'Ocorreu um erro executando seu comando!', ephemeral: true });
          }
        }
        break;
      }
    case interaction.isButton():
      {
        const buttonHandler = interaction.client.buttonHandlers.get(interaction.customId);
        if (!buttonHandler) {
          console.error(`No buttonHandler matching ${interaction.customId} was found.`);
          return;
        }

        if (needCooldown(buttonHandler?.cooldown, `buttonHandler-${buttonHandler.customId}`, interaction)) {
          return;
        }

        try {
          await buttonHandler.execute(interaction);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Ocorreu um erro executando seu comando!', ephemeral: true });
          } else {
            await interaction.reply({ content: 'Ocorreu um erro executando seu comando!', ephemeral: true });
          }
        }
        break;
      }
    case interaction.isModalSubmit():
      {
        const dialog = interaction.client.dialogs.get(interaction.customId);
        if (!dialog) {
          console.error(`No dialog matching ${interaction.customId} was found.`);
          return;
        }

        if (needCooldown(dialog?.cooldown, `dialog-${dialog.customId}`, interaction)) {
          return;
        }

        try {
          await dialog.handle(interaction);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Ocorreu um erro executando seu comando!', ephemeral: true });
          } else {
            await interaction.reply({ content: 'Ocorreu um erro executando seu comando!', ephemeral: true });
          }
        }
        break;
      }
    default:
      console.error(`Unknown interaction type ${interaction.type}`);
    // console.log(interaction);
  }
});

client.login(process.env['TOKEN']);
