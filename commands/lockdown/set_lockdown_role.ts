import { SlashCommandBuilder, ChatInputCommandInteraction, Role, type APIRole, PermissionsBitField, GuildMember } from 'discord.js';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('set_lockdown_role')
	.setDescription('Sets the role given when the user is in lockdown mode')
    .addRoleOption(option => option.setName("role")
                        .setDescription("Enter the role")
                        .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }

    const role = interaction.options.getRole("role");
    if (!role || !isRole(role)) {
        await interaction.reply({content: "This is not a valid role", ephemeral: true});
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    try {
        await addRoleToDatabase(role, serverID, serverName);
        await interaction.reply(`The role <@&${role.id}> has been set as the default lockdown role`);
    } catch (error) {
        await interaction.reply("Error with adding the role onto our database.");
        return;
    }
}

export function isRole(role: Role | APIRole): role is Role {
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
            await Servers.findOneAndUpdate({id: serverID}, {$set: {"serverConfig.lockdownConfig.lockdownRoleID": role.id}});
            console.log(`Server ${serverName} (id: ${serverID}) was found and its role ${role.name} (id: ${role.id}) has been updated`);
        }
    } catch (error) {
        console.error(`Could not save the server ${serverID} under the name ${serverName} and/or role ${role.id} to the database`, error);
        throw error;
    }
}

function makeNewServerDocumentWithRole(role: Role, serverID: string, serverName: string) {
    return new Servers({
        id: serverID,
        name: serverName,
        serverConfig: {
            lockdownConfig: {
                lockdownRoleID: role.id,
                lockdownLogChannel: null,
                lockdownRoleAccess: [],
                reason: "You are sus", // To make it custom later on
            }
        },
        loggedMembers: {
            globalBannedMembers: {
                userID: [],
                username: [],
                reason: [],
            },
            lockdownedMembers: {
                userID: [],
                username: [],
                reason: [],
            },
            warnedMembers: {
                userID: [],
                username: [],
                reason: [],
            },
            notedMembers: {
                userID: [],
                username: [],
                reason: [],
            }
        }
    });
}