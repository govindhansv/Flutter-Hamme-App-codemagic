const User = require('../models/User');
const ApiError = require('../utils/ApiError');

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
}

async function updateMe(userId, updates) {
  const allowedUpdates = {
    name: updates.name,
    instagramId: updates.instagramId,
    profileImageUrl: updates.profileImageUrl,
  };

  const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
}

async function getPublicProfile(shareCode) {
  const user = await User.findOne({ shareCode });
  if (!user) {
    throw new ApiError(404, 'Profile not found.');
  }

  return user;
}

module.exports = {
  getMe,
  updateMe,
  getPublicProfile,
};