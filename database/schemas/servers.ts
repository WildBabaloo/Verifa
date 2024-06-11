import mongoose, { Schema } from "mongoose";

const serverSchema = new Schema({
    id: String,
    name: String,
    serverConfig: {
        lockdownActive: Boolean,
        lockdownRoleID: String,
        lockdownChannels: [String]
    },
    loggedMembers: {
        globalBannedMembers: {
            userID: String,
            username: String,
            reason: String
        },
        lockdownedMembers: {
            userID: String,
            username: String,
            reason: String
        },
        warnedMembers: {
            userID: String,
            username: String,
            reason: String
        },
        notedMembers: {
            userID: String,
            username: String,
            reason: String
        }
    }
});

export type Server = mongoose.InferSchemaType<typeof serverSchema>;
export const Server = mongoose.model("Servers", serverSchema);