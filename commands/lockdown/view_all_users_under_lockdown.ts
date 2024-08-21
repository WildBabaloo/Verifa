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
    const lockdownedMembersUsernames = lockdownedMembers.map(member => member.username) as string[];
    const lockdownMembersDateTime = lockdownedMembers.map(member => member.dateAndTime) as string[];
    const lockdownMemebersModerators = lockdownedMembers.map(member => member.moderator) as string[];
    const lockdownedMembersReasons = lockdownedMembers.map(member => member.reason) as string[];
    // if (lockdownedMembersIDs.length == 0 && lockdownedMembersUsernames.length == 0 && lockdownedMembersReasons.length == 0) {
        // await interaction.reply("There are currently no users under lockdown");
        // return;
    // }
    // await interaction.reply({ embeds: [embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs, lockdownedMembersReasons)] });
    await interaction.reply({ embeds: [embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs, lockdownedMembersUsernames, lockdownMembersDateTime, lockdownMemebersModerators, lockdownedMembersReasons)] });
}

async function grabAllLockdownUsersIDFromTheDatabase(serverID: string) {
    const theServer = await Servers.findOne({ id: serverID });
    return theServer?.loggedMembers?.lockdownedMembers;
}

function embedBuilderForShowingAllLockdownedUsersInAServer(lockdownedMembersIDs: string[], lockdownedMembersUsernames: string[], lockdownMembersDateTime: string[], lockdownMemebersModerators: string[], lockdownedMembersReasons: string[]) {
    return new EmbedBuilder()
        .setTitle("List of all the current lockdowned members in the server")
        .addFields(
            { name: "Username", value: lockdownedMembersUsernames.join("\n"), inline: true },
            { name: "Users", value: lockdownedMembersIDs.map(id => `<@${id}>`).join("\n"), inline: true },
            { name: "Date", value: lockdownMembersDateTime.join("\n"), inline: true },
            { name: "Moderator", value: lockdownMemebersModerators.map(id => `<@${id}>`).join("\n"), inline: true },
            { name: "Reasons", value: lockdownedMembersReasons.join("\n"), inline: true } 
        )
        .setTimestamp()
}