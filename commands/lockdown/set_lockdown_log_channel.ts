import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, PermissionsBitField, GuildMember } from "discord.js";
import { Servers } from "../../database/schemas/servers";

export const data = new SlashCommandBuilder()
    .setName("set_lockdown_log_channel")
    .setDescription("Configure the log channel when the user is in lockdown and when they get out")
    .addChannelOption(option => option.setName("channel")
                            .setDescription("Enter a channel for the logs")
                            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }

    const channel = interaction.options.getChannel("channel");
    if (!(channel instanceof TextChannel)) {
        await interaction.reply({content: "Error! The channel must be a text channel!", ephemeral: true});
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    await addLogChannelToDatabase(channel, serverID, serverName);
    await interaction.reply(`The ${channel.name} channel is now the new default log channel for lockdowns`);
}

async function addLogChannelToDatabase(channel: TextChannel, serverID: string, serverName: string) {
    try {
        let server = await Servers.findOne({ id: serverID })
        if (!server) {
            console.log(`Server ${serverName} (id: ${serverID}) was not found in the database. Adding it now...`);
            server = makeNewServerDocumentWithChannel(channel, serverID, serverName);
            await server.save();
            console.log(`The ${channel.name} channel for the server called ${serverName} has been saved to the database`);
        } else {
            await Servers.findOneAndUpdate({id: serverID}, {$set: {"serverConfig.lockdownLogChannel": channel.id}});
            console.log(`Server ${serverName} (id: ${serverID}) was found and its channel ${channel.name} (id: ${channel.id}) has been updated`);
        }
    } catch (error) {
        console.error(`Could not save the server ${serverID} under the name ${serverName} and/or channel ${channel.id} to the database`, error);
        return null; 
    }
}

function makeNewServerDocumentWithChannel(channel: TextChannel, serverID: string, serverName: string) {
    return new Servers({
        id: serverID,
        name: serverName,
        serverConfig: {
            lockdownRoleID: null,
            lockdownLogChannel: channel.id,
            reason: "You are sus", // To make it custom later on
        },
        loggedMembers: {
            globalBannedMembers: {
                userID: [],
                username: [],
                reason: [],
            },
            lockdownedMembers: {
                userID: [],
                username: [],
                reason: [],
            },
            warnedMembers: {
                userID: [],
                username: [],
                reason: [],
            },
            notedMembers: {
                userID: [],
                username: [],
                reason: [],
            }
        }
    });
}