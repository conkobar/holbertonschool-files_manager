// Authentication controller for users


const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const uuid = require('uuidv4');


class AuthController {
  static async getConnect(request, response) {
    //Get the Authorization header from the request
    const authorization = request.header('Authorization');
    if (!authorization) return response.status(401).send({ error: 'Unauthorized' });
    const base64Credentials = authorization.split(' ')[1];
    if (!base64Credentials) return response.status(401).send({ error: 'Unauthorized' });
    //Decode the base64 string
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    if (!email || !password) return response.status(401).send({ error: 'Unauthorized' });
    //Find the user by email and password
    const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    const token = uuid();
    //Create an entry in Redis with the token as the key, and the user id as the value
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);
    return response.status(200).send({ token });
  }

  static async getDisconnect(request, response) {
    // Sign used out based on the token
    const token = request.header('X-Token');
    if (!token) return response.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    await redisClient.del(`auth_${token}`);
    return response.status(204).send();
  }

  static async getMe(request, response) {
    // retrieve the user based on the token
    const token = request.header('X-Token');
    if (!token) return response.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    return response.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = AuthController;
