// skeleton for redis client
const redis = require('redis');

// define redis client for export
class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', function (err) {
      console.log(err);
    });
  }

  // checks if redis connection is alive
  isAlive() {
    return this.client.connected;
  }

  // get method for redis client
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }

  // set method for redis client
  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', duration, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }

  // delete method for redis client
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
