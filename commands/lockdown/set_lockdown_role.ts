import { SlashCommandBuilder, ChatInputCommandInteraction, Role, type APIRole } from 'discord.js';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('set_lockdown_role')
	.setDescription('Sets the role given when the user is in lockdown mode')
    .addRoleOption(option => option.setName("role")
                        .setDescription("Enter the role")
                        .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role");
    if (!role || !isRole(role)) {
        await interaction.reply({content: "This is not a valid role", ephemeral: true});
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    await addRoleToDatabase(role, serverID, serverName);
	await interaction.reply(`The role ${role.name} (ID: ${role.id}) has been set as the default lockdown role`);
}

function isRole(role: Role | APIRole): role is Role {
    return (role as Role).id !== undefined;
}

async function addRoleToDatabase(role: Role, serverID: string, serverName: string) {
    try {
        let server = await Servers.findOne({id: serverID})
        if (!server) {
            console.log(`Server ${serverName} (id: ${serverID}) was not found in the database adding it now...`);
            server = makeNewServerDocumentWithRole(role, serverID, serverName);
            await server.save();
            console.log(`The ${role.name} (id: ${role.id}) role for the server called ${serverName} has been saved to the database`);
        } else {
            await Servers.findOneAndUpdate({id: serverID}, {$set: {"serverConfig.lockdownRoleID": role.id}});
            console.log(`Server ${serverName} (id: ${serverID}) was found and its role ${role.name} (id: ${role.id}) has been updated`);
        }
    } catch (error) {
        console.error(`Could not save the server ${serverID} under the name ${serverName} and/or role ${role.id} to the database`, error);
        return null; 
    }
}

function makeNewServerDocumentWithRole(role: Role, serverID: string, serverName: string) {
    return new Servers({
        id: serverID,
        name: serverName,
        serverConfig: {
            lockdownRoleID: role.id,
            lockdownLogChannel: null
        },
        loggedMembers: {
            globalBannedMembers: null,
            lockdownedMembers: null,
            warnedMembers: null,
            notedMembers: null
        }
    });
}