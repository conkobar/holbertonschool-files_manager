// user controller for express api
const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;
    // check that user email and password exist
    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password)
      return response.status(400).send({ error: 'Missing password' });
    // check if specific user exists
    const userExists = await dbClient.userExists(email);
    if (userExists)
      return response.status(400).send({ error: 'Already exist' });
    // create the user
    const userId = await dbClient.createUser(email, sha1(password));
    response.status(201).send({ id: userId, email });
  }
}

module.exports = UsersController;
