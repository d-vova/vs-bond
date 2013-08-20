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

```javascript
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

```javascript
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

  
Dep vs Req
----------

Dependencies are used when successful outcome is **not important** for execution of the dependent task

Requirements are used when successful outcome is **important** for execution of the dependent task

```javascript
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


bond.dep([ failure ]).run(doSomething).callback(display);  // will output "success"
bond.dep([ success ]).run(doSomething).callback(display);  // will output "success"

bond.req([ failure ]).run(doSomething).callback(display);  // will output "failure"
bond.req([ success ]).run(doSomething).callback(display);  // will output "success"
```


Obj
---

Object is used when the task must be executed inside of a given context/scope/namespace

```javascript
var bond = require('vs-bond');


var Context = function Context ( msg ) { this.msg = msg; }

Context.prototype.test = function test ( callback ) {
  var self = this;
  
  var done = function done ( ) {
    callback(null, self.msg);
  }
  
  setTimeout(done, 5);
}

Context.create = function create ( msg, callback ) {
  var done = function done ( ) {
    callback(null, new Context(msg));
  }
  
  setTimeout(done, 5);
}


var display = function display ( error, value ) {
  console.log(String(error || value));
}


var context = new Context('secret');
var test1 = bond.run(context.test).callback(display);         // will output "undefined"
var test2 = bond.obj(context).run('test').callback(display);  // will output "secret"
```

Instance object can also be a bond

```javascript
var context = bond.run(Context.create, 'secret');
var test3 = bond.obj(context).run('test').callback(display);  // will output "secret"
```


Run
---

Run applies arguments to a method after all dependencies are done executing and all requirements are met

  - Method can be represented by a function, a string, or a bond
  - Arguments can be represented by bonds

String representation of a method can only be used in conjunction with a previously specified instance of an object

All bonds encountered in top level arguments and method are automatically added to the list of requirements
and are unwrapped before execution


Callback
--------

Execute callback on task completion (regardless of whether it was successful or not)

```javascript
var bond = require('vs-bond');


var majorFailure = function majorFailure ( callback ) {
  setTimeout(function ( ) { callback('failure'); }, 5);
}

var majorSuccess = function majorSuccess ( callback ) {
  setTimeout(function ( ) { callback(null, 'success'); }, 5);
}


var display = function display ( error, value ) {
  console.log( error ? 'failure' : 'success' );
}


var failure = bond.run(majorFailure).callback(display);  // will output failure
var success = bond.run(majorSuccess).callback(display);  // will output success
```


License
-------

MIT
