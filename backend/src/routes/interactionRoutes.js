const express = require('express');
const { body } = require('express-validator');

const interactionController = require('../controllers/interactionController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('shareCode').trim().notEmpty(),
    body('type').isIn(['crush', 'friend', 'ameny']),
  ],
  validateRequest,
  interactionController.createInteraction
);

router.get('/matches', interactionController.getMatches);

module.exports = router;