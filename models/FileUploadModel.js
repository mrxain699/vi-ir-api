import mongoose from "mongoose";

const FileSchema = mongoose.Schema({
  file_org_name: { type: String, required: true, trim: true, unique: true },
  file_temp_name: { type: String, required: true, trim: true, unique: true },
  file_url: { type: String, trim: true, default: "" },
  created_at: {
    type: Date,
    required: true,
    trim: true,
    default: new Date(),
  },
});

const FileModel = mongoose.model("files", FileSchema);
const ImageModel = mongoose.model("images", FileSchema);

export { ImageModel, FileModel };
