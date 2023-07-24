// mongodb initialization
const { MongoClient } = require('mongodb');

//  mongodb class
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    this.url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
    this.client.connect();
  }

  // checks the active db connection
  isAlive() {
    return this.client.isConnected();
  }

  // returns number of docs in collection users
  async nbUsers() {
    const db = this.client.db();
    const collection = db.collection('users');
    return collection.countDocuments();
  }

  // returns number of docs in collection files
  async nbFiles() {
    const db = this.client.db();
    const collection = db.collection('files');
    return collection.countDocuments();
  }
}

// create and export instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;
