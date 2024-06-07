import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('lockdown_config')
	.setDescription('Updates the lockdown settings of the server');

export async function execute(interaction: CommandInteraction) {
	interaction.reply({ embeds: [embedBuilder()] })
}

function embedBuilder(): EmbedBuilder {
	return new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle('Verification (mock name) Lockdown Configuration')
	.addFields(
		{ name: 'Lockdown Role:', value: '@sus', inline: true},
		{ name: 'Log Channel: ', value: '#sus-logs', inline: true },
	)
	.setFooter({ text: 'Traverse through the menu to see your current configs'});
}
