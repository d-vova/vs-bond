vs-bond
=======

Reduce the complexity of asynchronous code


Installation
------------

```
npm install vs-bond
```


Quick Start
-----------

First, define a few asynchronous functions, for example for working with MongoDB:

```
var mongo = require('mongodb');

var connect = function connect ( connectionURI, callback ) {
  mongo.MongoClient.connect(connectionURI, callback);
}

var disconnect = function disconnect ( db, callback ) {
  db.close(callback);
}

var createCollection = function createCollection ( db, name, callback ) {
  db.createCollection(name, callback);
}

var createDocument = function createDocument ( collection, doc, callback ) {
  collection.save(doc, callback);
}

var findAll = function findAll ( collection, callback ) {
  collection.find().toArray(callback);
}
```

Second, use bonds to write program logic in a very natural way:

```
var bond = require('vs-bond');

var db = bond.run(connect, 'mongodb://localhost/sandbox');
var users = bond.run(createCollection, [ db, 'users' ]);

var names = [ 'Will', 'Bill', 'Jill' ];

var createdUsers = names.map(function ( name ) {
  return bond.obj(users).run('save', { name: name });
});

var done = function done ( error, value ) {
  console.log(error || value);

  bond.run(disconnect, db);
}

bond(createdUsers).run(findAll, users).callback(done).timeout(1000);
```

In this example we:
  - connected to database
  - used the connection to create a user collection
  - used the collection to create users
  - retrieved all users after creation
  - displayed retrieved users or a potential error
  - set a one second timeout for the whole process
  - and finally disconnect


License
-------

MIT
