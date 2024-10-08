import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, EmbedBuilder, TextChannel, PermissionsBitField } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { Users } from '../../database/schemas/users';

export const data = new SlashCommandBuilder()
	.setName("lockdown")
	.setDescription("Puts a user into lockdown mode")
	.addUserOption(option => option.setName("user")
		.setDescription("Enter the username of the person you would like to put into lockdown")
		.setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	try {
		const serverID = interaction.guild?.id as string;
		const serverName = interaction.guild?.name as string;
		const moderator = interaction.user.id;
		const commandAuthor = interaction.member as GuildMember;
		const memberCommandAuthor = await interaction.guild?.members.fetch(commandAuthor.id) as GuildMember;
		const userHasManagerRoles = await checkIfUserHasOneOfTheManagerRoles(memberCommandAuthor, serverID);
		const userHasLockdownAccessRoles = await checkIfUserHasOneOfTheAccessRoles(memberCommandAuthor, serverID);
		if (!isAdmin(commandAuthor) && !userHasLockdownAccessRoles && !userHasManagerRoles) {
			await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
			return;
		}

		const user = interaction.options.getUser("user");
		if (!user) {
			await interaction.reply({ content: "Error! The user is invalid.", ephemeral: true });
			return;
		}

		const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
		if (!member) {
			await interaction.reply({ content: "Please select a user that is in the current server.", ephemeral: true });
			return;
		}

		const currentChannel = interaction.channel;
		if (!currentChannel) {
			console.error("Interaction channel is null.");
			await interaction.reply({ content: "Error processing this command due to an unknown error (Most likely of discord's part)", ephemeral: true });
			return;
		}

		const alreadyLockdowned = await checkIfUserIsUnderLockdownInThatServer(serverID, member);
		if (alreadyLockdowned) {
			await interaction.reply(`<@${member.user.id}> is already under lockdown in this server`);
			return;
		}

		const lockdownRoleID = await getLockdownRoleIDFromDatabase(serverID);
		if (!lockdownRoleID) {
			await interaction.reply({ content: `Error! The lockdown role does not exist anymore or has not been set up. Please set up another role instead`, ephemeral: true });
			return;
		}

		// Giving user the lockdown role
		const userAvatar = member.user.avatarURL();
		const datetime = new Date();
		const formattedDate = datetime.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric"
		});
		const formattedTime = datetime.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		});
		const formattedDateTime = formattedDate + " at " + formattedTime;
		await member.roles.add(lockdownRoleID);
		await addServerToTheUserSchema(member, serverID, serverName, formattedDateTime);
		await addUserToTheServerSchema(member, serverID, formattedDateTime, commandAuthor.id);
		await interaction.reply(`<@${member.user.id}> has been put into lockdown mode`);
		await user.send({ embeds: [embedBuilderToDMUserThatTheyHaveBeenLockedDown(serverID, serverName)] });
		const logChannelID = await getLogChannelIDFromDatabase(serverID);
		if (logChannelID) {
			const logChannel = interaction.guild?.channels.cache.get(logChannelID) as TextChannel;
			if (logChannel) {
				await logChannel.send({ embeds: [embedBuilderForLogChannelWhenUserHasBeenLockedDown(member.user.id, member.user.username, userAvatar, moderator)] });
			} else {
				void currentChannel.send("Log channel was not found. The channel was either deleted or the bot has no longer has permissions to it");
			}
		} else {
			void currentChannel.send("Note: The log channel has not been configured");
		}
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'An error occurred while trying to add the lockdown role.', ephemeral: true });
		return;
	}
}

export async function checkIfUserHasOneOfTheManagerRoles(member: GuildMember, serverID: string) {
	const memberRoles = member.roles.cache.map(role => role.id);
	const theServer = await Servers.findOne({ id: serverID });
	const theServerManagerRoles = theServer?.serverConfig?.managerRoleIDs;
	return theServerManagerRoles ? theServerManagerRoles.some(managerRole => memberRoles.includes(managerRole)) : false;
}

export async function checkIfUserHasOneOfTheAccessRoles(member: GuildMember, serverID: string) {
	const memberRoles = member.roles.cache.map(role => role.id);
	const theServer = await Servers.findOne({ id: serverID });
	const theServerRoleAccess = theServer?.serverConfig?.lockdownConfig?.lockdownRoleAccess;
	return theServerRoleAccess ? theServerRoleAccess.some(roleAccess => memberRoles.includes(roleAccess)) : false;
}

export async function checkIfUserIsUnderLockdownInThatServer(serverID: string, member: GuildMember) {
	const theUser = await Users.findOne({ id: member.user.id });
	if (!theUser || !theUser.userLogs || !theUser.userLogs.activeLockdowns || !theUser.userLogs.activeLockdowns.server) {
		return false; // Nothing found in the DB
	}

	return theUser.userLogs.activeLockdowns.server.some((lockdown) => lockdown.serverID === serverID);
}

export function isAdmin(member: GuildMember): boolean {
	return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

async function addServerToTheUserSchema(member: GuildMember, serverID: string, serverName: string, datetime: string) {
	try {
		let theUser = await Users.findOne({ id: member.user.id });
		if (!theUser) {
			console.log(`User ${member.user.globalName} (ID: ${member.user.id}) was not found in the database. Adding it now...`);
			theUser = makeNewUserDocumentWithLockdown(member.user.id, member.user.globalName as string, serverID, serverName, datetime)
			await theUser.save();
			console.log(`User ${member.user.globalName} (ID: ${member.user.id}) has been added to the database`);
		} else {
			await Users.findOneAndUpdate(
				{ id: member.user.id },
				{
					$push: {
						"userLogs.activeLockdowns.server": {
							serverID: serverID,
							serverName: serverName,
							dateAndTime: datetime,
							reason: "You are sus",
						}
					}
				}
			);
			console.log(`Updated user schema for ${member.user.globalName}. They are now marked as lockdowned in ${serverName}`);
		}
	} catch (error) {
		console.error(`Error adding to the database for user: ${member.user.globalName} (ID: ${member.user.id}), serverID: ${serverID} and serverName: ${serverName}`, error);
		throw error;
	}
}

function makeNewUserDocumentWithLockdown(userId: string, username: string, serverID: string, serverName: string, datetime: string) {
	return new Users({
		id: userId,
		username: username,
		userLogs: {
			globalBans: {
				server: [],
			},
			activeLockdowns: {
				server: [{
					serverID: serverID,
					serverName: serverName,
					dateAndTime: datetime,
					reason: "You are sus",
				}],
			},
			notes: {
				server: [],
			},
		}
	})
}

async function addUserToTheServerSchema(member: GuildMember, serverID: string, datetime: string, moderatorID: string) {
	try {
		await Servers.findOneAndUpdate(
			{ id: serverID },
			{
				$push: {
					"loggedMembers.lockdownedMembers": {
						userID: member.user.id,
						username: member.user.globalName,
						dateAndTime: datetime,
						moderator: moderatorID,
						reason: "You are sus"
					}
				}
			}
		);
	} catch (error) {
		console.error(`Error adding the user ${member.user.globalName} (ID: ${member.user.id} onto the server schema with the ID of ${serverID})`, error);
		throw error;
	}
}

export async function getLockdownRoleIDFromDatabase(serverID: string) {
	const theServer = await Servers.findOne({ id: serverID });
	if (!theServer) return null;
	return theServer.serverConfig?.lockdownConfig?.lockdownRoleID;
}

export async function getLogChannelIDFromDatabase(serverID: string) {
	const theServer = await Servers.findOne({ id: serverID });
	if (!theServer) return null;
	return theServer.serverConfig?.lockdownConfig?.lockdownLogChannel;
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