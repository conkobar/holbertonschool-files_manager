// routes for our api

const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');


// GET /status
router.get('/status', (req, res) => {
  res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
}
);

// GET /stats
router.get('/stats', async (req, res) => {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();
  res.status(200).json({ users, files });
}
);

module.exports = router;
