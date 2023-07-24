// controller
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

// controller class for our api
class AppController {
  static getStatus(request, response) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    response.status(200).send(status);
  }

  static async getStats(request, response) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    const stats = { users, files };
    response.status(200).send(stats);
  }
}

module.exports = AppController;
