import { SlashCommandBuilder, ChatInputCommandInteraction, User, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { Users } from '../../database/schemas/users';
import { checkIfUserIsUnderLockdownInThatServer, getLockdownRoleIDFromDatabase, getLogChannelIDFromDatabase } from './lockdown_user';

export const data = new SlashCommandBuilder()
		.setName("unlock_user")
		.setDescription("Removes the lockdown role from a user that is currently under lockdown")
        .addUserOption(option => option.setName("user")
                            .setDescription("Enter the username of the person you would like to remove from its lockdown state")
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
    if (!alreadyLockdowned) {
        await interaction.reply(`${user.id} is currently not under lockdown`);
        return;
    }

    const lockdownRoleID = await getLockdownRoleIDFromDatabase(serverID);
	if (!lockdownRoleID) {
		await interaction.reply({content: `Error! The <@&${lockdownRoleID}> does not exist anymore or has not been set up. Please use another role instead`, ephemeral: true});
		return;
	}

    try {
        const member = await interaction.guild?.members.fetch(user.id) as GuildMember;
        await member.roles.remove(lockdownRoleID);
        await removeServerFromTheUserSchema(user, serverID, serverName);
        await removeUserFromTheServerSchema(user, serverID);
        await interaction.reply(`<@${user.id}> has been removed from their lockdown state`);
        await user.send({ embeds: [embedBuilderToDMUserThatTheyAreNoLongerUnderLockdown(serverID, serverName)] })
        const logChannelID = await getLogChannelIDFromDatabase(serverID);
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
        await interaction.reply({ content: 'An error occurred while trying to remove the lockdown role.', ephemeral: true });
    }
}

async function removeServerFromTheUserSchema(user: User, serverID: string, serverName: string) {
    try {
        await Users.findOneAndUpdate({id: user.id}, {$pull: {"userLogs.activeLockdowns.server.serverID": serverID, "userLogs.activeLockdowns.server.serverName": serverName}});
        console.log(`Updated user schema for ${user.globalName}. They are no longer marked as lockdowned in ${serverName}`);
    } catch (error) {
        console.error(`Error removing to the database for user: ${user.globalName} (ID: ${user.id}), serverID: ${serverID} and serverName: ${serverName}`, error);
        throw error;
    }
}

async function removeUserFromTheServerSchema(user: User, serverID: string) {
    try {
        await Servers.findOneAndUpdate({id: serverID}, {$pull: {"loggedMembers.lockdownedMembers.userID": user.id, "loggedMembers.lockdownedMembers.username": user.globalName}});
        console.log(`Updated server schema for ${serverID}. User ${user.id} is no longer marked as lockdowned`);
    } catch (error) {
        console.error(`Error removing to the database for user: ${user.globalName} (ID: ${user.id}), serverID: ${serverID}`, error);
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

