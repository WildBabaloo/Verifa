import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import { Server } from "../../database/schemas/servers";

export const data = new SlashCommandBuilder()
    .setName("set_lockdown_log_channel")
    .setDescription("Configure the log channel when the user is in lockdown and when they get out")
    .addChannelOption(option => option.setName("channel")
                            .setDescription("Enter a channel for the logs")
                            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel");
    if (!(channel instanceof TextChannel)) {
        await interaction.deferReply({ ephemeral: true });
        await interaction.reply("The channel must be a text channel");
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    await addLogChannelToDatabase(channel, serverID, serverName);
    await interaction.reply(`The ${channel.name} (id: ${channel.id}) is now the new default log channel for lockdowns`);
}

async function addLogChannelToDatabase(channel: TextChannel, serverID: string, serverName: string) {

}