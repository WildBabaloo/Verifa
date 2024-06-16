import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Server } from '../../database/schemas/servers';
import { User } from '../../database/schemas/users';

export const data = new SlashCommandBuilder()
		.setName("lockdown")
		.setDescription("Puts a user into lockdown mode")
		.addUserOption(option => option.setName("user")
							.setDescription("Enter the username of the person you would like to put into lockdown")
							.setRequired(true));	

export async function execute(interaction: ChatInputCommandInteraction) {
	const user = interaction.options.getUser("user");
	if (!user) {
		await interaction.reply({content: "Error! The user is invalid", ephemeral: true});
		return;
	}

	interaction.reply(`User ${user} has been put in lockdown`);
}