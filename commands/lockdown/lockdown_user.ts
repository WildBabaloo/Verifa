import { SlashCommandBuilder, ChatInputCommandInteraction, User } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { Users } from '../../database/schemas/users';
import { Mongoose } from 'mongoose';

export const data = new SlashCommandBuilder()
		.setName("lockdown")
		.setDescription("Puts a user into lockdown mode")
		.addUserOption(option => option.setName("user")
							.setDescription("Enter the username of the person you would like to put into lockdown")
							.setRequired(true));	

export async function execute(interaction: ChatInputCommandInteraction) {
	const user = interaction.options.getUser("user");
	if (!user) {
		await interaction.reply({content: "Error! The user is invalid", ephemeral: true});
		return;
	}
    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;	
	await addUserToTheDatabase(user, serverID, serverName);
	interaction.reply(`User ${user} has been put in lockdown`);
}

async function addUserToTheDatabase(user: User, serverID: string, serverName: string) {
	try {
		let user = await Users.findOne({})
	} catch (error) {
		console.error(`Error adding to the database for user: ${user}, serverID: ${serverID} and serverName: ${serverName}`, error);
        return null; 
	}
}

async function makeNewUserDocumentWithLockdown(userId: string, username: string, serverID: string, serverName: string) {
	return new Users({
		id: userId,
		username: username,
		userLogs: {
			globalBans: null,
			activeLockdowns: {
				server: {
					serverID: serverID, 
					serverName: serverName,
				}
			},
			notes: null,
		}
	})
}