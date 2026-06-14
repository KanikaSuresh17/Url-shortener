const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'jwtsecretkey';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function signup({ email, password, username, role }) {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw { status: 409, message: 'Email already registered. Please login or use a different email.' };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username: username || null,
    email,
    password: hashedPassword,
    role: role || 'user',
  });

  const token = generateToken(newUser);

  return {
    token,
    user: { id: newUser.id, email: newUser.email, username: newUser.username, role: newUser.role },
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { status: 401, message: 'Invalid credentials' };

  const token = generateToken(user);

  return {
    token,
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
  };
}

async function forgotPassword(email) {
  // Always return the same message to prevent email enumeration
  const user = await User.findOne({ where: { email } });
  if (!user) return; // Silently ignore — don't reveal existence

  // Generate a secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  // Send reset email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"SnipURL" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your SnipURL password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0b0f19; color: #f3f4f6; border-radius: 16px;">
        <h2 style="color: #6366f1; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">You requested a password reset for your SnipURL account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">Reset Password</a>
        <p style="color: #6b7280; font-size: 0.85rem; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

async function resetPassword(token, newPassword) {
  if (!token) throw { status: 400, message: 'Reset token is required' };

  const user = await User.findOne({ where: { resetToken: token } });
  if (!user) throw { status: 400, message: 'Invalid or expired reset token' };

  if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
    throw { status: 400, message: 'Reset token has expired. Please request a new one.' };
  }

  // Validate password strength
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  if (!newPassword || newPassword.length < 8 || !specialCharRegex.test(newPassword)) {
    throw { status: 400, message: 'Password must be at least 8 characters with at least one special character' };
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();
}

module.exports = { signup, login, forgotPassword, resetPassword };
