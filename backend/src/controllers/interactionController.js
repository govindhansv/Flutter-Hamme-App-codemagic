const interactionService = require('../services/interactionService');

async function createInteraction(req, res) {
  const result = await interactionService.createInteraction({
    fromUserId: req.auth.userId,
    shareCode: req.body.shareCode,
    type: req.body.type,
  });

  return res.status(201).json(result);
}

async function getMatches(req, res) {
  const matches = await interactionService.getMatchesForUser(req.auth.userId);
  return res.status(200).json({ matches });
}

module.exports = {
  createInteraction,
  getMatches,
};