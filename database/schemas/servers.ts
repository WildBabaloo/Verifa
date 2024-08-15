import mongoose, { Schema } from "mongoose";

const serverSchema = new Schema({
    id: String,
    name: String,
    serverConfig: {
        managerRoleIDs: [String],
        lockdownConfig: {
            lockdownRoleID: String,
            lockdownLogChannel: String,
            lockdownRoleAccess: [String],
            reason: String
        }
    },
    loggedMembers: {
        globalBannedMembers: {
            userID: [String],
            username: [String],
            dateAndTime: [String],
            moderator: [String],
            reason: [String]
        },
        lockdownedMembers: {
            userID: [String],
            username: [String],
            dateAndTime: [String],
            moderator: [String],
            reason: [String]
        },
        warnedMembers: {
            userID: [String],
            username: [String],
            dateAndTime: [String],
            moderator: [String],
            reason: [String]
        },
        notedMembers: {
            userID: [String],
            username: [String],
            dateAndTime: [String],
            moderator: [String],
            reason: [String]
        }
    }
});

export type Servers = mongoose.InferSchemaType<typeof serverSchema>;
export const Servers = mongoose.model("Servers", serverSchema);