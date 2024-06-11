import { SlashCommandBuilder, ChatInputCommandInteraction, Role, type APIRole } from 'discord.js';
import { database } from '../..';
import { Server } from '../../database/schemas/servers';
import * as mongoose from "mongoose";

export const data = new SlashCommandBuilder()
	.setName('set_lockdown_role')
	.setDescription('Sets the role given when the user is in lockdown mode')
    .addRoleOption(option => option.setName("role")
                        .setDescription("Enter the role")
                        .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role");
    console.log(`The role selected is ${role}`)
    if (!role || !isRole(role)) {
        await interaction.deferReply({ ephemeral: true })
        await interaction.reply("This is not a valid role")
        return;
    }

    const serverID = interaction.guild?.id as string;
    const serverName = interaction.guild?.name as string;
    await addRoleToDatabase(role, serverID, serverName);
	await interaction.reply(`The role ${role} has been set as the default lockdown role`)
}

function isRole(role: Role | APIRole): role is Role {
    return (role as Role).id !== undefined;
}

async function addRoleToDatabase(role: Role, serverID: string, serverName: String) {
    const server = new Server({
        id: serverID,
        name: serverName,
        serverConfig: {
            lockdownActive: true,
            lockdownRoleID: role,
            lockdownChannels: []
        },
        loggedMembers: {
            globalBannedMembers: null,
            lockdownedMembers: null,
            warnedMembers: null,
            notedMembers: null
        }
    })
    try {
        await server.save();
        console.log(`The ${role} role for the server called ${serverName} has been saved to the database`);
    } catch (error) {
        console.error(`Could not save ${role} to the database`, error);
        return null; 
    }
}