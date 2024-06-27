import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        parentFolderId: {
            type: Schema.Types.ObjectId,
            ref: "FOLDER",
            required: true,
            default: null
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "USER",
            required: true
        },
    },

    { timestamps: true }
);


export const FILE = mongoose.model("FILE", fileSchema);