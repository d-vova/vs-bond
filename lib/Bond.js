var Bond = module.exports = function Bond ( ) {
  this.method = null;
  this.instance = null;
  this.arguments = [ ];

  this.callbacks = [ ];

  this.counter = 0;
  this.progress = 0;

  this.reqs = [ ];
  this.refs = [ ];

  this.result = { }
}

Bond.prototype.req = function req ( bonds ) {
  var bonds = bonds instanceof Array ? bonds : bonds ? [ bonds ] : [ ];

  for ( var i = 0; i < bonds.length; i += 1 ) {
    var bond = bonds[i];

    if ( !bond ) continue;

    if ( this.progress == 0 ) {
      if ( bond.progress == 0 ) {
        this.reqs.push(bond);
        bond.refs.push(this);
      }

      if ( bond.progress == 0 ) this.counter += 1;
      if ( bond.progress == -1 ) this.progress = -1;
    }
  }

  return this;
}

Bond.prototype.obj = function obj ( instance ) {
  if ( this.instance || this.method ) {
    throw new Error('obj should be called once and before run');
  }

  this.instance = instance;

  return instance instanceof Bond ? this.req(instance) : this;
}

Bond.prototype.run = function run ( method, args ) {
  if ( this.method ) {
    throw new Error('run should be called once');
  }

  var async = false, method = method || Bond.METHOD;
  var args = args instanceof Array ? args : args ? [ args ] : [ ];

  this.method = method;

  if ( method instanceof Bond ) this.req(method);

  for ( var i = 0; i < args.length; i += 1 ) {
    this.arguments.push(args[i]);

    if ( args[i] instanceof Bond ) this.req(args[i]);

    async = async || (args[i] === Bond.CALLBACK);
  }

  if ( !async ) this.arguments.push(Bond.CALLBACK);

  if ( this.progress == -1 ) Bond.propagate(this);
  else if ( this.counter == 0 ) Bond.execute(this);
  
  return this;
}

Bond.prototype.callback = function callback ( fn ) {
  if ( !this.method ) {
    console.log('WARNING: callback is called before run');
  }

  if ( fn ) this.callbacks.push(fn);

  if ( this.progress != 0 ) {
    while ( this.callbacks.length > 0 ) {
      this.callbacks.shift()(this.result.error, this.result.value);
    }
  }
}

Bond.prototype.timeout = function timeout ( time ) {
  return Bond.timeout(this, time || 0);
}

Bond.prototype.valueOf = function valueOf ( ) {
  switch ( this.progress ) {
    case -1: return this.result.error;
    case  1: return this.result.value;
    default: return undefined;
  }
}

Bond.prototype.toString = function toString ( ) {
  return String(this.valueOf());
}

Bond.execute = function execute ( bond ) {
  if ( !bond.method ) return;
  if ( bond.progress != 0 || bond.counter != 0 ) return;

  var instance = bond.instance, method = bond.method, args = [ ];
  var callback = function callback ( error, value ) {
    if ( bond.progress != 0 ) return;

    bond.result.error = error;
    bond.result.value = value;

    bond.progress = error ? -1 : 1;

    Bond.propagate(bond);
  }

  instance = instance instanceof Bond ? instance.result.value : instance;

  method = method instanceof Bond ? method.result.value : method;
  method = method instanceof Function ? method : instance[method];

  for ( var i = 0; i < bond.arguments.length; i += 1 ) {
    var arg = bond.arguments[i] === Bond.CALLBACK ? callback : bond.arguments[i];

    args.push(arg instanceof Bond ? arg.result.value : arg);
  }

  process.nextTick(function ( ) { method.apply(instance, args); });
}

Bond.propagate = function propagate ( bond ) {
  if ( bond.progress == 0 ) return;

  bond.callback();

  for ( var i = 0; i < bond.refs.length; i += 1 ) {
    bond.refs[i].counter -= 1;

    if ( bond.progress == -1 ) {
      bond.refs[i].progress = -1;
      bond.refs[i].result.error = bond.result.error;

      Bond.propagate(bond.refs[i]);
    }
    else Bond.execute(bond.refs[i]);
  }

  bond.refs = [ ];
}

Bond.timeout = function timeout ( bond, time ) {
  if ( bond.timer ) return bond;

  var timeout = function timeout ( ) {
    if ( bond.progress != 0 ) return;

    bond.progress = -1;
    bond.result.error = 'timeout';

    Bond.propagate(bond);
  }

  bond.timer = setTimeout(timeout, time);

  return bond;
}

Bond.METHOD = function METHOD ( callback ) { callback(); }

Bond.CALLBACK = function CALLBACK ( ) {
  console.log('This function stub should have been replaced...');
  console.log('The arguments used to call this function stub:');
  console.log(JSON.stringify(arguments));
}


if ( require.main === module ) {
  console.log('Testing Bond at "' + __filename + '"...');

  var result = '', order = [ 'a', 'b', 'c', 'd', 'e' ];
  var template = function template ( char, callback ) {
    setTimeout(function ( ) {
      var next = order.shift(), color = char == next ? '2' : '1';

      result += '\033[3' + color + 'm' + char + '\033[30m';

      callback();
    }, 1 + 10 * Math.random() | 0);
  }

  var a = new Bond().run(template, [ 'a' ]);
  var b = new Bond().req(a).run(template, [ 'b' ]);
  var c = new Bond().req([a, b]).run(template, [ 'c' ]);
  var d = new Bond().req([a, c]).run(template, [ 'd' ]);
  var e = new Bond().req([c, d]).run(template, [ 'e' ]);

  e.callback(function ( ) {
    console.log('sequencing:         ' + result);
  });

  var p = { n: 100, count: 0, bond: new Bond() }, s = { n: 100, count: 0, bond: new Bond() }

  var worker = function worker ( obj, callback ) {
    setTimeout(function ( ) { obj.count += 1; callback(); }, 1 + 10 * Math.random() | 0);
  }

  for ( var i = 0; i < p.n; i += 1 ) p.bond.req(new Bond().run(worker, [ p ]));
  for ( var i = 0; i < s.n; i += 1 ) s.bond = new Bond().req(s.bond.run(worker, [ s ]));

  p.bond.run().callback(function ( ) {
    console.log('parallel execution: \033[3' + (p.count == p.n ? '2' : '1') + 'm' + p.count + '\033[30m');
  });

  s.bond.run().callback(function ( ) {
    console.log('serial execution:   \033[3' + (s.count == s.n ? '2' : '1') + 'm' + s.count + '\033[30m');
  });

  var ty = new Bond().run(function ( callback ) { setTimeout(function ( ) { callback(); }, 10); }).timeout(5);
  var tn = new Bond().run(function ( callback ) { setTimeout(function ( ) { callback(); }, 5); }).timeout(10);

  ty.callback(function ( ) {
    console.log('execution did:     \033[3' + (ty.result.error ? '2mtimeout' : '1mcompleted') + '\033[30m');
  });

  tn.callback(function ( ) {
    console.log('execution did:     \033[3' + (tn.result.error ? '1mtimeout' : '2mcompleted') + '\033[30m');
  });
}
