import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Server } from '../../database/schemas/servers';

export const data = new SlashCommandBuilder()
	.setName('lockdown_config')
	.setDescription('Updates the lockdown settings of the server');

export async function execute(interaction: CommandInteraction) {
	const serverID = interaction.guild?.id as string;
	let server = await Server.findOne({id: serverID})
	if (!server) {
		interaction.reply("This server has not configured its lockdown settings yet. You can do so with the /set_lockdown commands");
	}
	const lockdownRoleID = server?.serverConfig?.lockdownRoleID ?? "This value has not been set";
	const lockdownLogChannelID = server?.serverConfig?.lockdownLogChannel ?? "This value has not been set";
	interaction.reply({ embeds: [embedBuilder(lockdownRoleID, lockdownLogChannelID)] })
}

function embedBuilder(lockdownRoleID: string, lockdownLogChannelID: string): EmbedBuilder {
	return new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle('Lockdown Configuration')
	.addFields(
		{ name: 'Lockdown Role:', value: `<@&${lockdownRoleID}>`, inline: true},
		{ name: 'Log Channel: ', value: `<#${lockdownLogChannelID}>`, inline: true },
	)
	.setFooter({ text: 'Traverse through the menu to see your current configs'});
}
