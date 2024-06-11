import mongoose, { Schema } from "mongoose";

const serverSchema = new Schema({
    id: Number,
    name: String,
    serverConfig: {
        lockdownActive: Boolean,
        lockdownRoleID: Number,
        lockdownChannels: [Number]
    },
    loggedMembers: {
        globalBannedMembers: {
            userID: Number,
            username: String,
            reason: String
        },
        lockdownedMembers: {
            userID: Number,
            username: String,
            reason: String
        },
        warnedMembers: {
            userID: Number,
            username: String,
            reason: String
        },
        notedMembers: {
            userID: Number,
            username: String,
            reason: String
        }
    }
});

export type Server = mongoose.InferSchemaType<typeof serverSchema>;
export const Server = mongoose.model("Server", serverSchema);