import { SlashCommandBuilder, ChatInputCommandInteraction, Role, type APIRole } from 'discord.js';
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

    await addRoleToDatabase(role);
	interaction.reply("set lockdown role command")
}

function isRole(role: Role | APIRole): role is Role {
    return (role as Role).id !== undefined;
}

async function addRoleToDatabase(role: Role){

}