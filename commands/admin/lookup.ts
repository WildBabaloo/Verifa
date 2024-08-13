import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, EmbedBuilder, User } from 'discord.js';
import { checkIfUserIsUnderLockdownInThatServer } from '../lockdown/lockdown_user';

export const data = new SlashCommandBuilder()
	.setName('lookup')
	.setDescription('Provides additional information about the user mentioned which can only be accessed by certain roles.')
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

	// TODO: AFTER TICKER 65 IS DONE IS TO RESTRICT IT TO MANAGER ROLES ONLY

	const user = interaction.options.getUser("user");
	const member = user instanceof User ? await interaction.guild.members.fetch(user) : interaction.member;
	const serverID = interaction.guild.id;
	await interaction.reply({ embeds: [await embedBuilderForLookupUser(serverID, member)] });

	// Then post embeds of global bans, warns or notes when the number of it is above 0. (Will make embeds later)
}

async function embedBuilderForLookupUser(serverID: string, member: GuildMember) {
	return new EmbedBuilder()
		.setTitle(member.user.username)
		.setColor(0xFEF85B)
		.setThumbnail(member.user.avatarURL())
		.setDescription(`<@${member.id}>`)
		.addFields(
			{ name: "Joined", value: member.joinedAt?.toDateString() ?? "An Unknown Date" },
			{ name: "Registered", value: member.user.createdAt.toDateString() ?? "An Unknown Date" },
			{ name: "Under Lockdown?", value: await checkIfUserIsUnderLockdownInThatServer(serverID, member) ? "✅" : "❌" },
			{ name: "Number of Global Bans", value: "This user is clean (WIP)", inline: true },
			{ name: "Number of Global Warns", value: "This user is clean (WIP)", inline: true },
			{ name: "Number of Global Notes", value: "This user is clean (WIP)", inline: true }
		)
		.setTimestamp()
}

// I think its better that i make it one line but i will see
// { name: "Servers", value: "List of Servers user was globalbanned/noted in ", inline: true },
// { name: "Remark Type", value: "Ban, Warn or Note", inline: true },
// { name: "Date & Time", value: "Date and time of remark", inline: true }
