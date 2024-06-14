import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    id: String,
    username: String,
    userLogs: {
        globalBans: {
            server: {
                serverID: String, 
                serverName: String,
                reason: String
            }
        },
        activeLockdowns: {
            server: {
                serverID: String, 
                serverName: String,
                reason: String
            }
        },
        notes: {
            server: {
                serverID: String, 
                serverName: String,
                reason: String
            }
        }
    }
});

export type User = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model("Users", userSchema);