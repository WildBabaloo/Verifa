import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlockdown")
        .setDescription("Updates the lockdown settings of the server"),
    async execute(interaction: CommandInteraction) {
        await interaction.reply("test");
    }
}