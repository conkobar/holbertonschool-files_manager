// controller for filesystem
const { v4: uuid } = require('uuid');
const mongo = require('mongodb');
const fs = require('fs');
const Redis = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  static postUpload(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const key = await Redis.get(`auth_${token}`);
      // check if key is valid
      if (!key) return res.status(401).json({ error: 'Unauthorized' });
      // destructure body of request
      const {
        name, type, data, isPublic = false, parentId = 0,
      } = req.body;
      // check that name, type and data aren't missing
      if (!name) return res.status(400).json({ error: 'Missing name' });
      if (!type) return res.status(400).json({ error: 'Missing type' });
      if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });
      // check that parentId is valid
      if (parentId) {
        const file = await dbClient.db
          .collection('files')
          .findOne({ _id: new mongo.ObjectID(parentId) });
        // check that file exists
        if (!file) return res.status(400).json({ error: 'Parent not found' });
        // make sure file is a folder
        if (file && file.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
      }
      // create new file
      let newFile;
      if (type === 'folder') {
        newFile = await dbClient.db.collection('files').insertOne({
          userId: new mongo.ObjectId(key),
          name,
          type,
          isPublic,
          parentId,
        });
      } else {
        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        // make directory if it doesn't exist
        if (!fs.existsSync(FOLDER_PATH)) fs.mkdirSync(FOLDER_PATH);
        // define user path
        const filePath = `${FOLDER_PATH}/${uuid()}`;
        // decode data
        const decode = Buffer.from(data, 'base64').toString('utf-8');
        // wait for file writing process to finish
        await fs.promises.writeFile(filePath, decode);
        newFile = await dbClient.db.collection('files').insertOne({
          userId: new mongo.ObjectId(key),
          name,
          type,
          isPublic,
          parentId,
          filePath,
        });
      }
      // send 201: created status
      return res.status(201).send({
        id: newFile.insertedId,
        userId: key,
        name,
        type,
        isPublic,
        parentId,
      });
    })().catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.toString() });
    });
  }

  static getShow(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const user = await Redis.get(`auth_${token}`);
      // authorize user
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      // check db after authorization
      const file = await dbClient.db
        .collection('files')
        .findOne({ _id: new mongo.ObjectID(req.params.id) });
      // send 404: not found if file doesn't exist
      if (!file) return res.status(404).json({ error: 'Not found' });
      // send 404 if user info is wrong
      if (user !== file.userId.toString()) return res.status(404).json({ error: 'Not found' });
      // send 200: OK with user info
      return res.status(200).send({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    })();
  }

  static getIndex(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const user = await Redis.get(`auth_${token}`);
      // authorize user
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      // destructure query request
      const { parentId, page = 0 } = req.query;
      // create file object, checking parent folders
      let files;
      if (parentId) {
        files = await dbClient.db
          .collection('files')
          .aggregate([
            { $match: { parentId: new mongo.ObjectID(parentId) } },
            { $skip: page * 20 },
            { $limit: 20 },
          ])
          .toArray();
      } else {
        files = await dbClient.db
          .collection('files')
          .aggregate([
            { $match: { userId: new mongo.ObjectID(user) } },
            { $skip: page * 20 },
            { $limit: 20 },
          ])
          .toArray();
      }
      // format data for return
      const returnFile = files.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      }));
      // send 200: OK and return file
      return res.status(200).send(returnFile);
    })();
  }

  static putPublish(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const user = await Redis.get(`auth_${token}`);
      // authenticate user
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      // destructure parameters and find db
      const { id } = req.params;
      const file = await dbClient.db
        .collection('files')
        .findOne({ _id: new mongo.ObjectID(id) });
      // 404 if no file found or incorrect permissions
      if (!file) return res.status(404).json({ error: 'Not found' });
      if (user !== file.userId.toString()) return res.status(404).json({ error: 'Not found' });
      file.isPublic = true;
      // send 200: OK and return the file
      return res.status(200).send({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    })();
  }

  static putUnpublish(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const user = await Redis.get(`auth_${token}`);
      // authenticate user
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      // destructure params and find db
      const { id } = req.params;
      const file = await dbClient.db
        .collection('files')
        .findOne({ _id: new mongo.ObjectID(id) });
      // 404 if no file found or wrong permissions
      if (!file) return res.status(404).json({ error: 'Not found' });
      if (user !== file.userId.toString()) return res.status(404).json({ error: 'Not found' });
      file.isPublic = false;
      // return formatted file and send 200: OK
      return res.status(200).send({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    })();
  }

  static getFile(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const user = await Redis.get(`auth_${token}`);
      const file = await dbClient.db
        .collection('files')
        .findOne({ _id: new mongo.ObjectID(req.params.id) });
      // check that file exists and has correct permissions
      if (!file) return res.status(404).json({ error: 'Not found' });
      if (!file.isPublic && (!user || user !== file.userId.toString())) return res.status(404).json({ error: 'Not found' });
      if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });
      if (!fs.existsSync(file.localPath)) return res.status(404).json({ error: 'Not found' });
      // send 200: OK and requested file
      return res.status(200).send(fs.readFileSync(file.localPath));
    })();
  }
}

module.exports = FilesController;
