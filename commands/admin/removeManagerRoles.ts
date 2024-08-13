import { SlashCommandBuilder, ChatInputCommandInteraction, Role, PermissionsBitField, GuildMember } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { isRole } from '../lockdown/set_lockdown_role';
import { checkIfManagerRoleIsAlreadyInTheServerSchema } from './addManagerRoles';

export const data = new SlashCommandBuilder()
    .setName('remove_manager_role')
    .setDescription('Remove a role that currently is a manager in the server')
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
        if (!isManagerRoleInServerSchema) {
            await interaction.reply({ content: `<@&${role.id}> is not part of the list of managers so it cant be removed.`, ephemeral: true });
            return;
        }
        
        await removeManagerRoleFromTheDatabase(role, serverID, serverName);
        await interaction.reply(`The role <@&${role.id}> is no longer a manager in the server`);
    } catch (error) {
        await interaction.reply("Error with removing the role from our database.");
        return;
    }
}

async function removeManagerRoleFromTheDatabase(role: Role, serverID: string, serverName: string){
    try {
        await Servers.findOneAndUpdate({ id: serverID }, { $pull: { "serverConfig.managerRoleIDs": role.id } });
        console.log(`The role ${role.id} from the server ${serverName} (ID: ${serverID}) is no longer a manager`);
    } catch (error) {
        console.error(`Error removing manager role in ${serverName} (ID: ${serverID}) for the role under the ID of ${role.id}`, error);
        throw error;
    }
}