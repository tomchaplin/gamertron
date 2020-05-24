const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

var murderers = db.get('users').filter({murderer: true}).size().value();
var users = db.get('users').size().value();
console.log(`There are ${users} user and ${murderers} murderers`);
