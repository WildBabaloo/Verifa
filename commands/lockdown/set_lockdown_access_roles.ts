import { SlashCommandBuilder, ChatInputCommandInteraction, Role, type APIRole, PermissionsBitField, GuildMember } from 'discord.js';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('set_lockdown_access_role')
	.setDescription('Add a role that will have access to the lockdown commands')
    .addRoleOption(option => option.setName("role")
                        .setDescription("Enter the role")
                        .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Set lockdown access role command")
}