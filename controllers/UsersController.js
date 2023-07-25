// user controller for express api
const sha1 = require('sha1');
const dbClient = require('../utils/db');

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
        email: email,
        password: sha1(password),
      });
      // send status code 201: created
      return res.status(201).send({ id: newUser.insertedId, email });
    })();
  }
}

module.exports = UsersController;
