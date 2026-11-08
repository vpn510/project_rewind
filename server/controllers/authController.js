import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

const createToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim()) {
    throw new AppError("Name, email, and password are required", 400);
  }
  if (password.length < 8) throw new AppError("Password must be at least 8 characters", 400);
  const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password });
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string" || !email.trim()) throw new AppError("Email and password are required", 400);
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) throw new AppError("Invalid email or password", 401);
  res.json({ token: createToken(user), user: publicUser(user) });
}

export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function listDevelopers(_req, res) {
  const users = await User.find({ role: "developer" }).select("name email avatar").sort({ name: 1 }).limit(100);
  res.json(users);
}
