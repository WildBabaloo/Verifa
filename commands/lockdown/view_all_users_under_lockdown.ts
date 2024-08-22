import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
    .setName('view_all_users_under_lockdown')
    .setDescription('A list to view all users who are currently under lockdown');

export async function execute(interaction: CommandInteraction) {
    const serverID = interaction.guild?.id as string;
    const lockdownedMembers = await grabAllLockdownUsersIDFromTheDatabase(serverID);
    if (!lockdownedMembers || lockdownedMembers.length == 0) {
        await interaction.reply("There are currently no users under lockdown");
        return;
    }
    const lockdownedMembersIDs = lockdownedMembers.map(member => member.userID) as string[];
    const lockdownMembersDateTime = lockdownedMembers.map(member => member.dateAndTime) as string[];
    const lockdownMemebersModerators = lockdownedMembers.map(member => member.moderator) as string[];
    // if (lockdownedMembersIDs.length == 0 && lockdownedMembersUsernames.length == 0 && lockdownedMembersReasons.length == 0) {
        // await interaction.reply("There are currently no users under lockdown");
        // return;
    // }
    // await interaction.reply({ embeds: [embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs, lockdownedMembersReasons)] });
    await interaction.reply({ embeds: [embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs, lockdownMembersDateTime, lockdownMemebersModerators)] });
}

async function grabAllLockdownUsersIDFromTheDatabase(serverID: string) {
    const theServer = await Servers.findOne({ id: serverID });
    return theServer?.loggedMembers?.lockdownedMembers;
}

function embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs: string[], lockdownMembersDateTime: string[], lockdownMemebersModerators: string[] ) {
    return new EmbedBuilder()
        .setColor(0xFFE900)
        .setTitle("List of all the current lockdowned members in the server")
        .addFields(
            { name: "Users", value: lockdownedMembersIDs.map((id, index) => `${index + 1}. <@${id}>`).join("\n"), inline: true },
            { name: "Dates", value: lockdownMembersDateTime.map((datetime, index) => `${index + 1}. ${datetime}`).join("\n"), inline: true },
            { name: "Moderators", value: lockdownMemebersModerators.map((id, index) => `${index + 1}. <@${id}>`).join("\n"), inline: true },
        )
        .setTimestamp()
}