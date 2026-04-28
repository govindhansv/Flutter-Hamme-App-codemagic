const userService = require('../services/userService');

function toPublicProfile(user) {
  return {
    id: user.id,
    name: user.name,
    instagramId: user.instagramId,
    profileImageUrl: user.profileImageUrl,
    shareCode: user.shareCode,
    email: '',
  };
}

async function getMe(req, res) {
  const user = await userService.getMe(req.auth.userId);
  return res.status(200).json({ user: user.toJSON() });
}

async function updateMe(req, res) {
  const user = await userService.updateMe(req.auth.userId, req.body);
  return res.status(200).json({ user: user.toJSON() });
}

async function getPublicProfile(req, res) {
  const user = await userService.getPublicProfile(req.params.shareCode);
  return res.status(200).json({ user: toPublicProfile(user) });
}

module.exports = {
  getMe,
  updateMe,
  getPublicProfile,
};