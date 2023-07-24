// mongodb initialization
const { MongoClient } = require('mongodb');

//  mongodb class
class DBClient {
  constructor() {
    this.port = process.env.DB_PORT || 27017;
    this.host = process.env.DB_HOST || 'localhost';
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}/`);
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  // checks the active db connection
  isAlive() {
    return this.client.connected;
  }

  // returns number of docs in collection users
  async nbUsers() {
    return await this.client.nbUsers;
  }

  // returns number of docs in collection files
  async nbFiles() {
    return await this.client.nbFiles;
  }
}

// create and export instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;
