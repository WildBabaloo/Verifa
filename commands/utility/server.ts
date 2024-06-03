import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Provides information about the server."),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) {
			await interaction.reply("This command can only be used in a server.")
			return;
		}
		await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
	},
};
