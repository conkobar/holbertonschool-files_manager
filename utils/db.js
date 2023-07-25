// mongodb initialization
const { MongoClient } = require('mongodb');

//  mongodb class
class DBClient {
  constructor() {
    // find env variables for db
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;
    // create db
    MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
      if (client) {
        this.db = client.db(database);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      }
      if (err) {
        console.log(err);
        this.db = null;
      }
    });
  }

  // checks the active db connection
  isAlive() {
    return !!this.db;
  }

  // returns number of docs in collection users
  async nbUsers() {
    const numOfUsers = await this.users.countDocuments({});
    return numOfUsers;
  }

  // returns number of docs in collection files
  async nbFiles() {
    const numOfFiles = await this.files.countDocuments({});
    return numOfFiles;
  }
}

// create and export instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;
