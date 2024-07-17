import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    id: String,
    username: String,
    userLogs: {
        globalBans: {
            server: {
                serverID: [String], 
                serverName: [String],
                reason: [String]
            }
        },
        activeLockdowns: {
            server: {
                serverID: [String], 
                serverName: [String]
            }
        },
        notes: {
            server: {
                serverID: [String], 
                serverName: [String],
                reason: [String]
            }
        }
    }
});

export type Users = mongoose.InferSchemaType<typeof userSchema>;
export const Users = mongoose.model("Users", userSchema);