import { SlashCommandBuilder, ChatInputCommandInteraction, User, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
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
	const currentChannel = interaction.channel;
	if (!currentChannel) { 
		console.error("Interaction channel is null."); 
		await interaction.reply({content: "Error processing this command due to an unknown error (Most likely of discord's part)", ephemeral: true});
		return;
	}
    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
	const moderator = interaction.user.id;
	const userAvatar = user.avatarURL();	
	await addUserToTheDatabase(user, serverID, serverName);
	const lockdownRoleID = await getLockdownRoleIDFromDatabase(serverID);
	if (!lockdownRoleID) {
		await interaction.reply({content: `Error! The <@&${lockdownRoleID}> does not exist anymore or has an unknown issue with it. Please use another role instead`});
		return;
	}
	
	// Giving user the lockdown role
	try {
        const member = await interaction.guild?.members.fetch(user.id) as GuildMember;
        await member.roles.add(lockdownRoleID);
        await interaction.reply(`<@${user.id}> has been put into lockdown mode`);
		await user.send({ embeds: [embedBuilderToDMUserThatTheyHaveBeenLockedDown(serverID, serverName)] });
		const logChannelID = await getLogChannelIDFromDatbase(serverID);
		if (logChannelID) {
			const logChannel = interaction.guild?.channels.cache.get(logChannelID) as TextChannel;
			
			if (logChannel) {
				await logChannel.send({ embeds: [embedBuilderForLogChannelWhenUserHasBeenLockedDown(user.id, user.username, userAvatar , moderator)] });
			} else {
				void currentChannel.send("Log channel was not found. The channel was either deleted or the bot has no longer has permissions to it");
			}
		} else {
			void currentChannel.send("Note: The log channel has not been configured");
		}
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

async function getLockdownRoleIDFromDatabase(serverID: string) {
	const theServer = await Servers.findOne({ id: serverID });
	if (!theServer) return null;
	return theServer.serverConfig?.lockdownRoleID;
}

async function getLogChannelIDFromDatbase(serverID: string) {
	const theServer = await Servers.findOne({ id: serverID });
	if (!theServer) return null;
	return theServer.serverConfig?.lockdownLogChannel;
}

function embedBuilderToDMUserThatTheyHaveBeenLockedDown(serverID: string, serverName: string): EmbedBuilder {
	// TODO customizable title and description (found in ticket 35)
	return new EmbedBuilder()
	.setColor(0xE10600)
	.setTitle(`You have been locked down in ${serverName} (ID: ${serverID})`)
	.setDescription(`You have been deemed suspicious by the server owners and mods and is currently under lockdown from viewing the server's content. Please contact an admin or mod to get it sorted out`)
	.setTimestamp();
}

function embedBuilderForLogChannelWhenUserHasBeenLockedDown(userID: string, username: string, userAvatar: string | null, moderatorID: string): EmbedBuilder {
	return new EmbedBuilder()
	.setColor(0xFFE900)
	.setThumbnail(userAvatar)
	.setTitle(`User under lockdown | ${username}`)
	.addFields(
		{ name: 'User', value: `<@${userID}>`, inline: true },
		{ name: 'Moderator', value: `<@${moderatorID}>`, inline: true}
	)
	.setFooter({ text: `ID: ${userID}` })
	.setTimestamp()
}