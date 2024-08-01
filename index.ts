import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, TextChannel, type Interaction, EmbedBuilder } from 'discord.js';
import * as mongoose from "mongoose";
import { checkIfUserIsUnderLockdownInThatServer, getLockdownRoleIDFromDatabase } from './commands/lockdown/lockdown_user';

// Connection to the database
const database = process.env.MONGO_DB;
if (!database) {
	console.error("Database URL is not set in environment variables.");
	process.exit(1);
}

async function connectToDatabase() {
	try {
		await mongoose.connect(database as string);
		console.log("Connected to the database");
	} catch (error) {
		console.error("Could not connect to the database", error);
		process.exit(1);
	}
}

await connectToDatabase();
export { database }

// Connect discord bot 
declare module 'discord.js' {
	export interface Client {
		commands: Collection<string, Command>;
	}
}

interface Command {
	data: {
		name: string;
		toJSON: () => any;
	};
	execute: (interaction: Interaction) => Promise<void>;
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
	]
});

client.commands = new Collection<string, Command>();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.ts'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		// Using dynamic import for proper typing
		import(filePath).then((command: Command) => {
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}).catch((error) => {
			console.error(`[ERROR] Failed to import the command at ${filePath}:`, error);
		});
	}
}

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on("guildMemberAdd", async member => {
	const serverID = member.guild.id;
	const serverName = member.guild.name;
	const isUnderLockdown = await checkIfUserIsUnderLockdownInThatServer(serverID, member);
	const lockdownRoleID = await getLockdownRoleIDFromDatabase(serverID);
	if (isUnderLockdown && lockdownRoleID) {
		await member.roles.add(lockdownRoleID);
		console.log(`${member.displayName} has joined the server and they are under lockdown`);
		await member.send({ embeds: [embedBuilderToDMUserThatTheyHaveBeenLockedDownOnceTheyRejoinAServer(serverID, serverName)] });
		const logChannelID = await getLockdownRoleIDFromDatabase(serverID);
		if (logChannelID) {
			const logChannel = member.guild.channels.cache.get(logChannelID) as TextChannel | undefined;
			if (logChannel?.isTextBased()) {
				logChannel.send({ embeds: [embedBuilderForLogChannelWhenUserHasBeenLockedDownAndRejoinsTheServer(member.id, member.displayName, member.avatarURL())] });
			}
		}
	}
});

function embedBuilderForLogChannelWhenUserHasBeenLockedDownAndRejoinsTheServer(userID: string, username: string, userAvatar: string | null): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(0xFFE900)
		.setThumbnail(userAvatar)
		.setTitle(`User who has rejoined the server is now under lockdown | ${username}`)
		.addFields(
			{ name: 'User', value: `<@${userID}>`, inline: true },
		)
		.setFooter({ text: `ID: ${userID}` })
		.setTimestamp()
}

function embedBuilderToDMUserThatTheyHaveBeenLockedDownOnceTheyRejoinAServer(serverID: string, serverName: string): EmbedBuilder {
	// TODO customizable title and description (found in ticket 35)
	return new EmbedBuilder()
		.setColor(0xE10600)
		.setTitle(`You have joined a server that you were previously lockdowned in ${serverName}`)
		.setDescription(`You have been deemed suspicious by the server owners and mods and are currently under lockdown from viewing the server's content. Please contact an admin or mod to get it sorted out`)
		.setTimestamp();
}

client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
