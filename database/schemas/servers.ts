import mongoose, { Schema } from "mongoose";

const serverSchema = new Schema({
    id: String,
    name: String,
    serverConfig: {
        lockdownRoleID: String,
        lockdownLogChannel: String,
        reason: String
    },
    loggedMembers: {
        globalBannedMembers: {
            userID: [String],
            username: [String],
            reason: [String]
        },
        lockdownedMembers: {
            userID: [String],
            username: [String],
            reason: [String]
        },
        warnedMembers: {
            userID: [String],
            username: [String],
            reason: [String]
        },
        notedMembers: {
            userID: [String],
            username: [String],
            reason: [String]
        }
    }
});

export type Servers = mongoose.InferSchemaType<typeof serverSchema>;
export const Servers = mongoose.model("Servers", serverSchema);