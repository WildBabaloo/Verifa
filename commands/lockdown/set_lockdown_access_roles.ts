import { SlashCommandBuilder, ChatInputCommandInteraction, Role, PermissionsBitField, GuildMember } from 'discord.js';
import { isRole } from './set_lockdown_role';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('set_lockdown_access_role')
	.setDescription('Add a role that will have access to the lockdown commands')
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
        await addAccessRoleToTheDatabase(role, serverID, serverName);
        await interaction.reply(`The role <@&${role.id}> has been been added. People with this role can now use the lockdown commands`);
    } catch (error) {
        await interaction.reply("Error with adding the role onto our database.");
        return;
    }
}

async function addAccessRoleToTheDatabase(role: Role, serverID: string, serverName: string) {
    try {
        let server = await Servers.findOne({id: serverID})
        if (!server) {
            console.log(`Server ${serverName} (id: ${serverID}) was not found in the database adding it now...`);
            server = makeNewServerDocumentWithAccessRole(role, serverID, serverName);
            await server.save();
            console.log(`The ${role.name} (id: ${role.id}) role for the server called ${serverName} has been saved to the database as a new role that has access to lockdown commands`);
        } else {
            await Servers.findOneAndUpdate({id: serverID}, {$push: {"serverConfig.lockdownConfig.lockdownRoleAccess": role.id}});
            console.log(`Server ${serverName} (id: ${serverID}) was found and its role ${role.name} (id: ${role.id}) has been added to the access roles for the lockdown commands`);
        }
    } catch (error) {
        console.error(`Could not save the server ${serverID} under the name ${serverName} and/or role ${role.id} to the database`, error);
        throw error;
    }
}

function makeNewServerDocumentWithAccessRole(role: Role, serverID: string, serverName: string) {
    return new Servers({
        id: serverID,
        name: serverName,
        serverConfig: {
            lockdownConfig: {
                lockdownRoleID: null,
                lockdownLogChannel: null,
                lockdownRoleAccess: [role.id],
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