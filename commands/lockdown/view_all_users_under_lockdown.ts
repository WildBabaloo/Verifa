import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('view_all_users_under_lockdown')
	.setDescription('A list to view all users who are currently under lockdown');

export async function execute(interaction: CommandInteraction) {
    const serverID = interaction.guild?.id as string;
    const lockdownedMembers = await grabAllLockdownUsersIDFromTheDatabase(serverID);
    const lockdownedMembersIDs = lockdownedMembers?.userID as string[];
    const lockdownedMembersUsernames = lockdownedMembers?.username as string[];
    const lockdownedMembersReasons = lockdownedMembers?.reason as string[];
    if (lockdownedMembersIDs.length == 0 && lockdownedMembersUsernames.length == 0 && lockdownedMembersReasons.length == 0) {
        await interaction.reply("There are currently no users under lockdown");
        return;
    }
    await interaction.reply({ embeds: [embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs, lockdownedMembersReasons)] });
}

async function grabAllLockdownUsersIDFromTheDatabase(serverID: string) {
    const theServer = await Servers.findOne({ id: serverID });
    return theServer?.loggedMembers?.lockdownedMembers;
}

function embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs: string[], lockdownedMembersReasons: string[]) {
    return new EmbedBuilder()
        .setTitle("List of all the current lockdowned members in the server")
        .addFields(
            { name: "Users", value: lockdownedMembersIDs.map(id => `<@${id}>`).join("\n") },
            // The reason part will be filled in for a later ticket
            // { name: "Reasons", value: lockdownedMembersReasons.join("\n") } 
        )
        .setTimestamp()
}

