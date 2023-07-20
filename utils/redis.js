// skeleton for redis client
const redis = require('redis');
const { promisify } = require('util');

// define redis client for export
class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
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
    return await this.getAsync(key);
  }

  // set method for redis client
  async set(key, value, duration) {
    return await this.setAsync(key, value, 'EX', duration);
  }

  // delete method for redis client
  async del(key) {
    return await this.delAsync(key);
  }
}

// export our class as a new redis instance
const redisClient = new RedisClient();
module.exports = redisClient;
