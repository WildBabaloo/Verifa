import { SlashCommandBuilder, CommandInteraction, GuildMember } from 'discord.js';

export const data = new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.');

export async function execute(interaction: CommandInteraction) {
		if (!interaction.guild) {
			await interaction.reply("This command can only be used in a server.");
			return;
		}
		if (!interaction.member || !(interaction.member instanceof GuildMember)) {
			await interaction.reply("This command can only be done by a member.");
			return;
		}

		const member = interaction.member;
		const joinedAt = member.joinedAt ? member.joinedAt.toDateString() : "an unknown date";

		await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${joinedAt}.`);
}
