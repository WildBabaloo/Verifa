import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('set_lockdown_role')
	.setDescription('Sets the role given when the user is in lockdown mode');

export async function execute(interaction: CommandInteraction) {
	interaction.reply("set lockdown role command")
}