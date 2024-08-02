import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('view_all_users_under_lockdown')
	.setDescription('A list to view all users who are currently under lockdown');

export async function execute(interaction: CommandInteraction) {
    await interaction.reply("view_all_users_under_lockdown command");
}