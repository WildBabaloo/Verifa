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
	const alreadyLockdowned = await checkIfUserIsUnderLockdownInThatServer(serverID, user);
	if (alreadyLockdowned) {
		await interaction.reply(`<@${user.id}> is already under lockdown in this server`); 
		return;
	}

	const lockdownRoleID = await getLockdownRoleIDFromDatabase(serverID);
	if (!lockdownRoleID) {
		await interaction.reply({content: `Error! The <@&${lockdownRoleID}> does not exist anymore or has not been set up. Please use another role instead`, ephemeral: true});
		return;
	}

	// Giving user the lockdown role
	try {
        const member = await interaction.guild?.members.fetch(user.id) as GuildMember;
        await member.roles.add(lockdownRoleID);
		await addServerToTheUserSchema(user, serverID, serverName);
		await addUserToTheServerSchema(user, serverID);
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

export async function checkIfUserIsUnderLockdownInThatServer(serverID: string, user: User) {
	const theUser = await Users.findOne({ id: user.id });
	if (!theUser || !theUser.userLogs || !theUser.userLogs.activeLockdowns || !theUser.userLogs.activeLockdowns.server) {
		return false; // Nothing found in the DB
	}

	return theUser.userLogs.activeLockdowns.server.serverID.includes(serverID);
}

async function addServerToTheUserSchema(user: User, serverID: string, serverName: string) {
	try {
		let theUser = await Users.findOne({ id: user.id });
		if (!theUser) {
			console.log(`User ${user.globalName} (ID: ${user.id}) was not found in the database. Adding it now...`);
			theUser = makeNewUserDocumentWithLockdown(user.id, user.globalName as string, serverID, serverName)
			await theUser.save();
			console.log(`User ${user.globalName} (ID: ${user.id}) has been added to the database`);
		} else {
			await Users.findOneAndUpdate({id: user.id}, {$push: {"userLogs.activeLockdowns.server.serverID": serverID, "userLogs.activeLockdowns.server.serverName": serverName, "userLogs.activeLockdowns.server.reason": "You are sus"}});
			console.log(`Updated user schema for ${user.globalName}. They are now marked as lockdowned in ${serverName}`);
		}
	} catch (error) {
		console.error(`Error adding to the database for user: ${user.globalName} (ID: ${user.id}), serverID: ${serverID} and serverName: ${serverName}`, error);
		throw error;
	}
}

function makeNewUserDocumentWithLockdown(userId: string, username: string, serverID: string, serverName: string) {
	return new Users({
		id: userId,
		username: username,
		userLogs: {
			globalBans: {
				server: {
					serverID: [], 
					serverName: [],
					reason: [],
				}
			},
			activeLockdowns: {
				server: {
					serverID: [serverID], 
					serverName: [serverName],
					reason: ["You are sus"],
				}
			},
			notes: {
				server: {
					serverID: [], 
					serverName: [],
					reason: [],
				}
			},
		}
	})
}

async function addUserToTheServerSchema(user: User, serverID: string) {
	try {
		await Servers.findOneAndUpdate({id: serverID}, {$set: {"loggedMembers.lockdownedMembers.userID": user.id, "loggedMembers.lockdownedMembers.username": user.globalName}});
	} catch (error) {
		console.error(`Error adding the user ${user.globalName} (ID: ${user.id} onto the server schema with the ID of ${serverID}) Here is the error message: `);
		console.error(error);
		throw error;
	}
}

export async function getLockdownRoleIDFromDatabase(serverID: string) {
	const theServer = await Servers.findOne({ id: serverID });
	if (!theServer) return null;
	return theServer.serverConfig?.lockdownRoleID;
}

export async function getLogChannelIDFromDatbase(serverID: string) {
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
	.setTitle(`User Under Lockdown | ${username}`)
	.addFields(
		{ name: 'User', value: `<@${userID}>`, inline: true },
		{ name: 'Moderator', value: `<@${moderatorID}>`, inline: true }
	)
	.setFooter({ text: `ID: ${userID}` })
	.setTimestamp()
}