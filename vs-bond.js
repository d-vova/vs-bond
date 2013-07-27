var Bond = require('./lib/Bond');

var bond = module.exports = function bond ( bonds ) {
  return new Bond().req(bonds);
}

bond.req = function req ( bonds ) {
  return new Bond().req(bonds);
}

bond.obj = function obj ( instance ) {
  return new Bond().obj(instance);
}

bond.run = function run ( method, args ) {
  return new Bond().run(method, args);
}

bond.callback = function callback ( fn ) {
  return new Bond().callback(fn);
}

bond.timeout = function timeout ( ms ) {
  return new Bond().timeout(ms);
}

bond.cb = Bond.CALLBACK;


if ( require.main === module && process.argv[2] == 'test' ) {
  var exec = require('child_process').exec;

  var log = function log ( error, value ) {
    console.log(error || value);
  }

  exec('node lib/Bond.js', log);
}
