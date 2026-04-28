const bcrypt = require('bcryptjs');

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const generateShareCode = require('../utils/generateShareCode');
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} = require('./tokenService');

async function createUniqueShareCode(name) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareCode = generateShareCode(name);
    const existingUser = await User.exists({ shareCode });
    if (!existingUser) {
      return shareCode;
    }
  }

  throw new ApiError(500, 'Unable to allocate a share code.');
}

function buildAuthResponse(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  return { accessToken, refreshToken, user: user.toJSON() };
}

async function signup({ name, email, password, instagramId, profileImageUrl }) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const shareCode = await createUniqueShareCode(name);
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    instagramId,
    passwordHash,
    profileImageUrl,
    shareCode,
  });

  const tokens = buildAuthResponse(user);
  await User.findByIdAndUpdate(user.id, {
    $push: { refreshTokens: tokens.refreshToken },
  });

  return tokens;
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash +refreshTokens'
  );

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const safeUser = await User.findById(user.id);
  const tokens = buildAuthResponse(safeUser);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  return tokens;
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required.');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Refresh token is invalid or expired.');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new ApiError(401, 'Refresh token is no longer valid.');
  }

  user.refreshTokens = user.refreshTokens.filter((item) => item !== refreshToken);

  const safeUser = await User.findById(user.id);
  const tokens = buildAuthResponse(safeUser);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  return tokens;
}

async function logout(userId, refreshToken) {
  const update = refreshToken
    ? { $pull: { refreshTokens: refreshToken } }
    : { $set: { refreshTokens: [] } };

  await User.findByIdAndUpdate(userId, update);
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getCurrentUser,
};