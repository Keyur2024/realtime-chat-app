import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true }, // stored as a hash, never plain text
  createdAt: { type: Date, default: Date.now },
});

// "Keyur" and "keyur" count as the same name
userSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

export default mongoose.model("User", userSchema);
