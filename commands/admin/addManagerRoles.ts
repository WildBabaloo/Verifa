import { SlashCommandBuilder, ChatInputCommandInteraction, Role, PermissionsBitField, GuildMember } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { isRole } from '../lockdown/set_lockdown_role';

export const data = new SlashCommandBuilder()
    .setName('add_manager_role')
    .setDescription('Add a role to the list of server managers/moderators')
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
        await interaction.reply({ content: "This is not a valid role", ephemeral: true });
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    try {
        const isManagerRoleInServerSchema = await checkIfManagerRoleIsAlreadyInTheServerSchema(role, serverID);
        if (isManagerRoleInServerSchema) {
            await interaction.reply({ content: `<@&${role.id}> is already part of the manager roles`, ephemeral: true })
            return;
        }
        await addManagerRoleToTheDatabase(role, serverID, serverName);
        await interaction.reply(`The role <@&${role.id}> has been been added to list of of managers in the server`);
    } catch (error) {
        console.log(`Error with adding ${role.id} onto the database for this server ${serverName} (ID: ${serverID})`, error);
        await interaction.reply("Error with adding the role onto our database.");
        return;
    }
}

export async function checkIfManagerRoleIsAlreadyInTheServerSchema(role: Role, serverID: string) {
    const theServer = await Servers.findOne({ id: serverID });
    if (theServer) {
        return theServer.serverConfig?.managerRoleIDs.includes(role.id);
    }

    return false;
}

async function addManagerRoleToTheDatabase(role: Role, serverID: string, serverName: string) {
    try {
        let theServer = await Servers.findOne({ id: serverID });
        if (!theServer) {
            console.log(`Server ${serverName} (id: ${serverID}) was not found in the database adding it now...`);
            theServer = makeNewServerDocumentWithManagerRole(role, serverID, serverName);
            await theServer.save();
            console.log(`The ${role.name} (id: ${role.id}) role for the server called ${serverName} has been saved to the database as a new role that is now part of the list of managers for that server`);
        } else {
            await Servers.findOneAndUpdate({ id: serverID }, { $push: { "serverConfig.managerRoleIDs": role.id } });
            console.log(`Server ${serverName} (id: ${serverID}) was found and its role ${role.name} (id: ${role.id}) has now been added to the list of managers`);
        }
    } catch (error) {
        console.error(`Could not save the server ${serverID} under the name ${serverName} and/or role ${role.id} to the database`, error);
        throw error;
    }
}

function makeNewServerDocumentWithManagerRole(role: Role, serverID: string, serverName: string) {
    return new Servers({
        id: serverID,
        name: serverName,
        serverConfig: {
            managerRoleIDs: [role.id],
            lockdownConfig: {
                lockdownRoleID: null,
                lockdownLogChannel: null,
                lockdownRoleAccess: [],
                reason: null
            }
        },
        loggedMembers: {
            globalBannedMembers: {
                userID: [],
                username: [],
                dateAndTime: [],
                moderator: [],
                reason: [],
            },
            lockdownedMembers: {
                userID: [],
                username: [],
                dateAndTime: [],
                moderator: [],
                reason: [],
            },
            warnedMembers: {
                userID: [],
                username: [],
                dateAndTime: [],
                moderator: [],
                reason: [],
            },
            notedMembers: {
                userID: [],
                username: [],
                dateAndTime: [],
                moderator: [],
                reason: [],
            }
        }
    });
}