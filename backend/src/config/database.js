const mongoose = require('mongoose');

const env = require('./env');
const logger = require('../utils/logger');

async function connectDatabase() {
  await mongoose.connect(env.mongoUri);
  logger.info(`MongoDB connected to ${mongoose.connection.name}`);
}

module.exports = connectDatabase;