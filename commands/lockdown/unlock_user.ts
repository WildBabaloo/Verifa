import { SlashCommandBuilder, ChatInputCommandInteraction, User, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { Users } from '../../database/schemas/users';
import { isAdmin, checkIfUserHasOneOfTheAccessRoles, checkIfUserHasOneOfTheManagerRoles, checkIfUserIsUnderLockdownInThatServer, getLockdownRoleIDFromDatabase, getLogChannelIDFromDatabase } from './lockdown_user';

export const data = new SlashCommandBuilder()
	.setName("unlock")
	.setDescription("Removes the lockdown role from a user that is currently under lockdown")
	.addUserOption(option => option.setName("user")
		.setDescription("Enter the username of the person you would like to remove from its lockdown state")
		.setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const serverID = interaction.guild?.id as string;
	const serverName = interaction.guild?.name as string;
	const moderator = interaction.user.id;
	const commandAuthor = interaction.member as GuildMember;
	const memberCommandAuthor = await interaction.guild?.members.fetch(commandAuthor.id) as GuildMember;
	const userHasManagerRoles = await checkIfUserHasOneOfTheManagerRoles(memberCommandAuthor, serverID);
	const userHasLockdownAccessRoles = await checkIfUserHasOneOfTheAccessRoles(memberCommandAuthor, serverID);
	console.log(userHasLockdownAccessRoles);
	if (!isAdmin(commandAuthor) && !userHasLockdownAccessRoles && !userHasManagerRoles) {
		await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
		return;
	}
	
	const user = interaction.options.getUser("user") as User;
	if (!user) {
		await interaction.reply({ content: "Error! The user is invalid", ephemeral: true });
		return;
	}

	const member = await interaction.guild?.members.fetch(user) as GuildMember;
	if (!member) {
		await interaction.reply({ content: "Error! Please select a user that is in the current server.", ephemeral: true });
	}

	const currentChannel = interaction.channel;
	if (!currentChannel) {
		console.error("Interaction channel is null.");
		await interaction.reply({ content: "Error processing this command due to an unknown error (Most likely of discord's part)", ephemeral: true });
		return;
	}

	const userAvatar = member.user.avatarURL();
	const alreadyLockdowned = await checkIfUserIsUnderLockdownInThatServer(serverID, member);
	if (!alreadyLockdowned) {
		await interaction.reply(`${member.user.id} is currently not under lockdown`);
		return;
	}

	const lockdownRoleID = await getLockdownRoleIDFromDatabase(serverID);
	if (!lockdownRoleID) {
		await interaction.reply({ content: `Error! The <@&${lockdownRoleID}> does not exist anymore or has not been set up. Please use another role instead`, ephemeral: true });
		return;
	}

	try {
		await member.roles.remove(lockdownRoleID);
		await removeServerFromTheUserSchema(member, serverID, serverName);
		await removeUserFromTheServerSchema(member, serverID);
		await interaction.reply(`<@${member.user.id}> has been removed from their lockdown state`);
		await user.send({ embeds: [embedBuilderToDMUserThatTheyAreNoLongerUnderLockdown(serverID, serverName)] })
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
		await interaction.reply({ content: 'An error occurred while trying to remove the lockdown role.', ephemeral: true });
	}
}

async function removeServerFromTheUserSchema(member: GuildMember, serverID: string, serverName: string) {
	try {
		await Users.findOneAndUpdate({ id: member.user.id }, { $pull: { "userLogs.activeLockdowns.server.serverID": serverID, "userLogs.activeLockdowns.server.serverName": serverName } });
		console.log(`Updated user schema for ${member.user.globalName}. They are no longer marked as lockdowned in ${serverName}`);
	} catch (error) {
		console.error(`Error removing to the database for user: ${member.user.globalName} (ID: ${member.user.id}), serverID: ${serverID} and serverName: ${serverName}`, error);
		throw error;
	}
}

async function removeUserFromTheServerSchema(member: GuildMember, serverID: string) {
	try {
		await Servers.findOneAndUpdate({ id: serverID }, { $pull: { "loggedMembers.lockdownedMembers.userID": member.user.id, "loggedMembers.lockdownedMembers.username": member.user.globalName } });
		console.log(`Updated server schema for ${serverID}. User ${member.user.id} is no longer marked as lockdowned`);
	} catch (error) {
		console.error(`Error removing to the database for user: ${member.user.globalName} (ID: ${member.user.id}), serverID: ${serverID}`, error);
		throw error;
	}
}

function embedBuilderToDMUserThatTheyAreNoLongerUnderLockdown(serverID: string, serverName: string): EmbedBuilder {
	// TODO customizable title and description (found in ticket 35)
	return new EmbedBuilder()
		.setColor(0x30DF30)
		.setTitle(`You are no longer in lockdown in ${serverName} (ID: ${serverID})`)
		.setDescription(`You can now view the server as a regular member again.`)
		.setTimestamp();
}

function embedBuilderForLogChannelWhenUserHasBeenLockedDown(userID: string, username: string, userAvatar: string | null, moderatorID: string): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(0x30DF30)
		.setThumbnail(userAvatar)
		.setTitle(`User Unlocked | ${username}`)
		.addFields(
			{ name: 'User', value: `<@${userID}>`, inline: true },
			{ name: 'Moderator', value: `<@${moderatorID}>`, inline: true }
		)
		.setFooter({ text: `ID: ${userID}` })
		.setTimestamp()
}

