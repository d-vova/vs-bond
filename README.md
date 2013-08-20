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

var display = function display ( error, value ) {
  console.log(error || value);
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

var allUsers = bond.req(createdUsers).run(findAll, users)

allUsers.callback(display).timeout(1000);

bond.dep(allUsers).run(disconnect, db);
```

  - connected to the database
  - used the connection to create a user collection
  - used the collection to create users
  - retrieved all users after creation
  - displayed retrieved users or a potential error
  - set a one second timeout for the whole process
  - and finally, disconnected

  
Dependencies
------------

Dependencies are used when successful outcome is **not important** for execution of the dependent task

```
var bond = require('vs-bond');

var majorFailure = function majorFailure ( callback ) {
  setTimeout(function ( ) { callback('failure'); }, 5);
}

var majorSuccess = function majorSuccess ( callback ) {
  setTimeout(function ( ) { callback(null, 'success'); }, 5);
}

var doSomething = function doSomething ( callback ) {
  setTimeout(function ( ) { callback(); }, 5);
}

var display = function display ( error, value ) {
  console.log( error ? 'failure' : 'success' );
}

var failure = bond.run(majorFailure);
var success = bond.run(majorSuccess);

bond.dep(failure).run(doSomething).callback(display);  // will output "success"
bond.dep(success).run(doSomething).callback(display);  // will output "success"
```


Requirements
------------

Requirements are used when successful outcome is **important** for execution of the dependent task

```
var bond = require('vs-bond');

var majorFailure = function majorFailure ( callback ) {
  setTimeout(function ( ) { callback('failure'); }, 5);
}

var majorSuccess = function majorSuccess ( callback ) {
  setTimeout(function ( ) { callback(null, 'success'); }, 5);
}

var doSomething = function doSomething ( callback ) {
  setTimeout(function ( ) { callback(); }, 5);
}

var display = function display ( error, value ) {
  console.log( error ? 'failure' : 'success' );
}

var failure = bond.run(majorFailure);
var success = bond.run(majorSuccess);

bond.req(failure).run(doSomething).callback(display);  // will output "failure"
bond.req(success).run(doSomething).callback(display);  // will output "success"
```


License
-------

MIT
