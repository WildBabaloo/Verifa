import { SlashCommandBuilder, ChatInputCommandInteraction, Role, PermissionsBitField, GuildMember } from 'discord.js';
import { isRole } from './set_lockdown_role';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('remove_lockdown_access_role')
	.setDescription('Remove a role that will have access to the lockdown commands.')
    .addRoleOption(option => option.setName("role")
                        .setDescription("Enter the role")
                        .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("remove_lockdown_access_role")
}