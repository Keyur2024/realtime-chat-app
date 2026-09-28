import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const CASE_INSENSITIVE = { locale: "en", strength: 2 };

const createToken = (user) =>
  jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        error: "Username must be 3-20 characters: letters, numbers, underscore",
      });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ username }).collation(CASE_INSENSITIVE);
    if (exists) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });

    res.status(201).json({ token: createToken(user), username: user.username });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username already taken" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = username
      ? await User.findOne({ username }).collation(CASE_INSENSITIVE)
      : null;
    const passwordOk =
      user && (await bcrypt.compare(password || "", user.password));

    if (!passwordOk) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.status(200).json({ token: createToken(user), username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};
