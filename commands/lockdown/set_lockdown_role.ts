import { SlashCommandBuilder, ChatInputCommandInteraction, Role, type APIRole } from 'discord.js';
import { Server } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('set_lockdown_role')
	.setDescription('Sets the role given when the user is in lockdown mode')
    .addRoleOption(option => option.setName("role")
                        .setDescription("Enter the role")
                        .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role");
    if (!role || !isRole(role)) {
        await interaction.deferReply({ ephemeral: true })
        await interaction.reply("This is not a valid role")
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    await addRoleToDatabase(role, serverID, serverName);
	await interaction.reply(`The role ${role} has been set as the default lockdown role`)
}

function isRole(role: Role | APIRole): role is Role {
    return (role as Role).id !== undefined;
}

async function addRoleToDatabase(role: Role, serverID: string, serverName: string) {
    try {
        let server = await Server.findOne({id: serverID})
        if (!server) {
            console.log(`Server ${serverName} (id: ${serverID}) was not found in the database adding it now...`);
            server = await makeNewServerDocument(role, serverID, serverName);
            await server.save();
            console.log(`The ${role.name} (id: ${role.id}) role for the server called ${serverName} has been saved to the database`);
        } else {
            await Server.findOneAndUpdate({id: serverID}, {serverConfig: {lockdownRoleID: role.id}}, {new: true});
            console.log(`Server ${serverName} (id: ${serverID}) was found and its role ${role.name} (id: ${role.id}) has been updated`);
        }
    } catch (error) {
        console.error(`Could not save the server ${serverID} under the name ${serverName} and/or role ${role.id} to the database`, error);
        return null; 
    }
}

async function makeNewServerDocument(role: Role, serverID: string, serverName: string) {
    return new Server({
        id: serverID,
        name: serverName,
        serverConfig: {
            lockdownActive: true,
            lockdownRoleID: role.id,
            lockdownChannels: []
        },
        loggedMembers: {
            globalBannedMembers: null,
            lockdownedMembers: null,
            warnedMembers: null,
            notedMembers: null
        }
    })
}