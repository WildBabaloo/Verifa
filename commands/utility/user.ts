import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, EmbedBuilder, User } from 'discord.js';
import { checkIfUserIsUnderLockdownInThatServer } from '../lockdown/lockdown_user';

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
		const serverID = interaction.guild.id;
		await interaction.reply({embeds: [await embedBuilderForUserInfo(serverID, member)]});
}

async function embedBuilderForUserInfo(serverID: string, member: GuildMember) {
	return new EmbedBuilder()
		.setTitle(member.user.username)
		.setThumbnail(member.user.avatarURL())
		.setDescription(`<@${member.id}>`)
		.addFields(
			{ name: "Joined", value: member.joinedAt?.toDateString() ?? "An Unknown Date", inline: true },
			{ name: "Registered", value: member.user.createdAt.toDateString() ?? "An Unknown Date", inline: true }
		)
		.addFields(
			{ name: `Roles [${member.roles.cache.size - 1}]`, value:  displayAllUserRoles(member, serverID)}
		)
		.addFields(
			{ name: "Key Permissions", value: displayKeyUserPermissions(member) }
		)
		.addFields( 
			{ name: "Under Lockdown?", value: await checkIfUserIsUnderLockdownInThatServer(serverID, member) ? "✅" : "❌" }
		 )
		 .addFields(
			{ name: "Warnings", value: "WIP" }
		 )
		.setTimestamp()
}

function displayAllUserRoles(member: GuildMember, serverID: string) {
	const roles = member.roles.cache
		.filter(role => role.id !== serverID)
		.map(role => role.toString())
		.join(", ");	
	if (roles == '' || roles == "") { return "This user has no roles attributed to them" }

	return roles;
}

function displayKeyUserPermissions(member: GuildMember) {
	const moderatorPermissionsArray = [
		"KickMembers", 
		"BanMembers", 
		"Administrator", 
		"ManageChannels", 
		"ManageGuild", 
		"ViewAuditLog", 
		"ManageMessages", 
		"MentionEveryone", 
		"ViewGuildInsights", 
		"MuteMembers", 
		"DeafenMembers",
  		"MoveMembers",
		"ManageNicknames",
		"ManageRoles", 
		"ManageWebhooks",
		"ManageEmojisAndStickers",
		"ManageGuildExpressions",
		"ManageEvents", 
		"ManageThreads",
		"ModerateMembers"

	];
	
	const moderatorPermissions = member.permissions.toArray()
		.filter(perm => moderatorPermissionsArray.includes(perm));
	const formattedModeratorPermissions = moderatorPermissions.map(perm => {
        return perm
            .replace(/([A-Z])/g, ' $1') 
            .replace(/^./, str => str.toUpperCase());
    }).join(',');

	if (formattedModeratorPermissions == '' || formattedModeratorPermissions == "") { return "This user has no key moderator permissions in the server" }

	return formattedModeratorPermissions;
}
