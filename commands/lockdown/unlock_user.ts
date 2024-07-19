import { SlashCommandBuilder, ChatInputCommandInteraction, User, GuildMember } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { Users } from '../../database/schemas/users';
import { checkIfUserIsUnderLockdownInThatServer, getLockdownRoleIDFromDatabase, getLogChannelIDFromDatbase } from './lockdown_user';

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
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while trying to remove the lockdown role.', ephemeral: true });
    }
}

async function removeServerFromTheUserSchema(user: User, serverID: string, serverName: string) {
    try {
        await Users.findOneAndUpdate({id: user.id}, {$pull: {"userLogs.activeLockdowns.server.serverID": serverID, "userLogs.activeLockdowns.server.serverName": serverName}});
    } catch (error) {
        console.error(`Error adding to the database for user: ${user.globalName} (ID: ${user.id}), serverID: ${serverID} and serverName: ${serverName}`, error);
        throw error;
    }
}

async function removeUserFromTheServerSchema()