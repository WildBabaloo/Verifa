import { SlashCommandBuilder, ChatInputCommandInteraction, User, GuildMember } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { Users } from '../../database/schemas/users';

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
	const lockdownRoleID = await getLockdownRoleID(serverID);
	if (!lockdownRoleID) {
		await interaction.reply({content: `Error! The <@&${lockdownRoleID}> does not exist anymore or has an unknown issue with it. Please use another role instead`});
		return;
	}
	
	// Giving user the lockdown role
	try {
        const member = await interaction.guild?.members.fetch(user.id) as GuildMember;
        await member.roles.add(lockdownRoleID);
        await interaction.reply(`User ${user.username} (ID: ${user.id}) has been put in lockdown`);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while trying to add the lockdown role.', ephemeral: true });
    }
}

async function addUserToTheDatabase(user: User, serverID: string, serverName: string) {
	try {
		let theUser = await Users.findOne({ id: user.id });
		if (!theUser) {
			console.log(`User ${user.globalName} (ID: ${user.id}) was not found in the database. Adding it now...`);
			theUser = makeNewUserDocumentWithLockdown(user.id, user.globalName as string, serverID, serverName)
			await theUser.save();
			console.log(`User ${user.globalName} (ID: ${user.id}) has been added to the database`);
		}
	} catch (error) {
		console.error(`Error adding to the database for user: ${user.globalName} (ID: ${user.id}), serverID: ${serverID} and serverName: ${serverName}`, error);
        return null; 
	}
}

async function getLockdownRoleID(serverID: string) {
	const theServer = await Servers.findOne({ id: serverID });
	if (!theServer) return null;
	return theServer.serverConfig?.lockdownRoleID;
}

function makeNewUserDocumentWithLockdown(userId: string, username: string, serverID: string, serverName: string) {
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