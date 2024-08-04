import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, EmbedBuilder, User } from 'discord.js';

export const data = new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Provides information about the user mentioned.')
		.addUserOption(option => option.setName("user")
								.setDescription("Enter the user you would like to lookup"));

export async function execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			await interaction.reply("This command can only be used in a server.");
			return;
		}
		if (!interaction.member || !(interaction.member instanceof GuildMember)) {
			await interaction.reply("This command can only be done by a member.");
			return;
		}

		const user = interaction.options.getUser("user");
		const member = user instanceof User ? await interaction.guild.members.fetch(user) : interaction.member;
		await interaction.reply({embeds: [embedBuilderForUserInfo(member)]});
}

function embedBuilderForUserInfo(member: GuildMember) {
	return new EmbedBuilder()
		.setTitle(member.user.username)
		.setThumbnail(member.user.avatarURL())
		.setDescription(`<@${member.id}>`)
		.addFields(
			{ name: "Joined", value: member.joinedAt?.toDateString() ?? "An Unknown Date", inline: true },
			{ name: "Registered", value: member.user.createdAt.toDateString() ?? "An Unknown Date", inline: true }
		)
		.setTimestamp()
}
