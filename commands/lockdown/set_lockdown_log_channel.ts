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
        await interaction.reply({content: "Error! The channel must be a text channel!", ephemeral: true});
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    await addLogChannelToDatabase(channel, serverID, serverName);
    await interaction.reply(`The ${channel} channel is now the new default log channel for lockdowns`);
}

async function addLogChannelToDatabase(channel: TextChannel, serverID: string, serverName: string) {
    try {
        let server = await Server.findOne({ id: serverID })
        if (!server) {
            console.log(`Server ${serverName} (id: ${serverID}) was not found in the database adding it now...`);
            server = await makeNewServerDocumentWithChannel(channel, serverID, serverName);
            await server.save();
            console.log(`The ${channel.name} channel for the server called ${serverName} has been saved to the database`);
        } else {
            await Server.findOneAndUpdate({id: serverID}, {$set: {"serverConfig.lockdownLogChannel": channel.id}});
            console.log(`Server ${serverName} (id: ${serverID}) was found and its channel ${channel.name} (id: ${channel.id}) has been updated`);
        }
    } catch (error) {
        console.error(`Could not save the server ${serverID} under the name ${serverName} and/or channel ${channel.id} to the database`, error);
        return null; 
    }
}

async function makeNewServerDocumentWithChannel(channel: TextChannel, serverID: string, serverName: string) {
    return new Server({
        id: serverID,
        name: serverName,
        serverConfig: {
            lockdownRoleID: null,
            lockdownLogChannel: channel.id
        },
        loggedMembers: {
            globalBannedMembers: null,
            lockdownedMembers: null,
            warnedMembers: null,
            notedMembers: null
        }
    });
}