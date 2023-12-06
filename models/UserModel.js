import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
  username: { type: String, required: true, trim: true, unqiue: true },
  password: { type: String, required: true, trim: true },
  created_at: {
    type: Date,
    required: true,
    trim: true,
    default: new Date(),
  },
});

const UserModel = mongoose.model("users", UserSchema);

export default UserModel;
