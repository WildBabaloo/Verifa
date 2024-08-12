import { SlashCommandBuilder, ChatInputCommandInteraction, Role, PermissionsBitField, GuildMember } from 'discord.js';
import { Servers } from '../../database/schemas/servers';
import { isRole } from '../lockdown/set_lockdown_role';

export const data = new SlashCommandBuilder()
	.setName('addManagerRole')
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
        await interaction.reply({content: "This is not a valid role", ephemeral: true});
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    // Check if role is already in manager list
    // If not then add role to db
}