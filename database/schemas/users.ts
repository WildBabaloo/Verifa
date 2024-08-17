import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    id: String,
    username: String,
    userLogs: {
        globalBans: {
            server: [
                {
                    userID: String,
                    username: String,
                    dateAndTime: String,
                    reason: String
                }
            ],
        },
        activeLockdowns: {
            server: [
                {
                    userID: String,
                    username: String,
                    dateAndTime: String,
                    reason: String
                }
            ],
        },
        notes: {
            server: [
                {
                    userID: String,
                    username: String,
                    dateAndTime: String,
                    reason: String
                }
            ],
        }
    }
});

export type Users = mongoose.InferSchemaType<typeof userSchema>;
export const Users = mongoose.model("Users", userSchema);