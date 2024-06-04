import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('setlockdown')
	.setDescription('Updates the lockdown settings of the server');

export async function execute(interaction: CommandInteraction) {
	await interaction.reply('test');
}
