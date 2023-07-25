// user controller for express api
const sha1 = require('sha1');
const mongo = require('mongodb');
const dbClient = require('../utils/db');
const Redis = require('../utils/redis');

class UsersController {
  static postNew(req, res) {
    (async () => {
      // destructure request
      const { email, password } = req.body;
      // check email and password
      if (!email) return res.status(400).json({ error: 'Missing email' });
      if (!password) return res.status(400).json({ error: 'Missing password' });
      // check that the user doesn't exist already
      const user = await dbClient.db.collection('users').findOne({ email });
      if (user) return res.status(400).json({ error: 'Already exist' });
      // hash the user's password and save them to db
      const newUser = await dbClient.db.collection('users').insertOne({
        email,
        password: sha1(password),
      });
      // send status code 201: created
      return res.status(201).send({ id: newUser.insertedId, email });
    })();
  }

  // gets a user's information
  static getMe(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const user = await Redis.get(`auth_${token}`);
      const userID = new mongo.ObjectID(user);
      console.log(`token: ${token}, user: ${user}, userID: ${userID}`);
      // try to fetch user data
      const userData = await dbClient.db
        .collection('users')
        .findOne({ _id: userID });
      if (!userData) return res.status(401).send({ error: 'Unauthorized' });
      // send status code 200: OK
      return res.status(200).send({ id: userData._id, email: userData.email });
    })();
  }
}

module.exports = UsersController;
