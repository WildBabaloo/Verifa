import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Servers } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('lockdown_config')
	.setDescription('Updates the lockdown settings of the server');

export async function execute(interaction: CommandInteraction) {
	const serverID = interaction.guild?.id as string;
	const server = await Servers.findOne({id: serverID})
	if (!server) {
		void interaction.reply({content: "This server has not configured its lockdown settings yet. You can do so with the /set_lockdown commands", });
		return;
	}
	const lockdownRoleID = server?.serverConfig?.lockdownConfig?.lockdownRoleID 
    ? `<@&${server.serverConfig.lockdownConfig.lockdownRoleID}>`
    : "This value has not been set";
	const lockdownLogChannelID = server?.serverConfig?.lockdownConfig?.lockdownLogChannel
	?  `<#${server.serverConfig.lockdownConfig.lockdownLogChannel}>`
	: "This value has not been set";
	const lockdownRoleAccessIDs = server?.serverConfig?.lockdownConfig?.lockdownRoleAccess ?? [];
	const lockdownRoleAccessMentions = lockdownRoleAccessIDs.length > 0 ? lockdownRoleAccessIDs.map((id: string) => `<@&${id}>`).join(", ") : "No additional roles has been added yet.";
	void interaction.reply({ embeds: [embedBuilder(lockdownRoleID, lockdownLogChannelID, lockdownRoleAccessMentions)] })
}

function embedBuilder(lockdownRoleID: string, lockdownLogChannelID: string, lockdownRoleAccessMentions: string): EmbedBuilder {
	return new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle('Lockdown Configuration')
	.addFields(
		{ name: 'Lockdown Role:', value: lockdownRoleID, inline: true},
		{ name: 'Log Channel: ', value: lockdownLogChannelID, inline: true },
		{ name: 'Lockdown Access Roles: ', value: lockdownRoleAccessMentions, inline: true },
	)
	.setFooter({ text: 'Traverse through the menu to see your current configs'});
}
