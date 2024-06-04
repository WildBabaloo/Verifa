import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with Pong!");

export async function execute(interaction: CommandInteraction) {
		const currentTime = new Date().toISOString().replace(/T/, " ").replace(/\..+/, " ");
		console.log(`This command was done by ${interaction.user.username} (ID: ${interaction.user.id}) at ${currentTime}`);
		await interaction.reply('Pong!');
}
