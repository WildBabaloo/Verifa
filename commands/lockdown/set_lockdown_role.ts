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
	await interaction.reply(`The role ${role} has been set as the default lockdown role`)
}

function isRole(role: Role | APIRole): role is Role {
    return (role as Role).id !== undefined;
}

async function addRoleToDatabase(role: Role){
    const database = process.env.MONGO_DB;
    if (!database) return null
    await mongoose.connect(database);
    console.log("Connected to the database");
}