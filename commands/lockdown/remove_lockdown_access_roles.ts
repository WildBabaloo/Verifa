import { SlashCommandBuilder, ChatInputCommandInteraction, Role, PermissionsBitField, GuildMember } from 'discord.js';
import { isRole } from './set_lockdown_role';
import { checkIfAccessRoleIsAlreadyInTheServerSchema } from './set_lockdown_access_roles';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('remove_lockdown_access_role')
	.setDescription('Remove a role that currently has access to the lockdown commands.')
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
        const isAccessRoleInServerSchema = await checkIfAccessRoleIsAlreadyInTheServerSchema(role, serverID);
        if (!isAccessRoleInServerSchema) {
            await interaction.reply({content: `<@&${role.id}> already does not have access to the lockdown commands so it cant be removed.`, ephemeral: true});
            return;
        }
        await removeAccessRoleFromTheDatabase(role, serverID, serverName);
        await interaction.reply(`The role <@&${role.id}> has been revoked access from using the lockdown commands.`);
    } catch (error) {
        await interaction.reply("Error with removing the role from our database.");
        return;
    }
}

async function removeAccessRoleFromTheDatabase(role: Role, serverID: string, serverName: string) {
    try {
        await Servers.findOneAndUpdate({id: serverID}, {$pull: {"serverConfig.lockdownConfig.lockdownRoleAccess": role.id}});
        console.log(`Access for the role ${role.id} from the server ${serverName} (ID: ${serverID}) has now been revoked`);
    } catch (error) {
        console.error(`Error removing access role in ${serverName} (ID: ${serverID}) for the role under the ID of ${role.id}`, error);
        throw error;
    }
}