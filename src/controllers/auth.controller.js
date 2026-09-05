const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    console.log(`[AUTH LOG] Registration successful for ${email} from IP: ${ip}`);
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      console.log(`[AUTH LOG] Login failed (Invalid credentials) for ${email} from IP: ${ip}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '30d' }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    console.log(`[AUTH LOG] Login successful for ${email} from IP: ${ip}`);
    res.json({ accessToken, refreshToken, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    const isValid = user && await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) return res.status(401).json({ message: 'Invalid refresh token' });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[AUTH LOG] Forgot password OTP sent to ${email} from IP: ${ip}`);
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -refreshTokenHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log(`[AUTH LOG] Account deleted for ${user.email} from IP: ${ip}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { _id: { $ne: req.user.id } }; // always exclude self

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(query)
      .select('name email _id')
      .sort({ name: 1 })
      .limit(50)
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
