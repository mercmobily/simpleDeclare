"use NOstrict";
/*
Copyright (C) 2015 Tony Mobily

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var async = require('async');

// Note to self: I didn't think I would ever end up writing
// something like this. I wish super() was implemented in node.
// We will need to wait for ECMA 6... Ugh.
var inherited = function( type, args, cb ){  


  var bases = this.__proto__.bases || workoutBases( this.constructor );
  var callee = args.callee;

  // First of all, look in the object itself
  var found = false;

  var objMethods = Object.getOwnPropertyNames( this );
  for( var i = 0, l = objMethods.length; i < l; i ++ ){
    var k = objMethods[ i ];

    if( this[ k ] === callee ){
      found = true;
      break;
    }
  };

  if( found ){
    i = bases.length;
  } else {
 
    // Look for the method called within base
    found = false;
    for( var i = 0, l = bases.length; i < l; i ++ ){
      var base = bases[ i ];

      ownMethods = Object.getOwnPropertyNames( base.prototype )
      for( var ii = 0, ll = ownMethods.length; ii < ll; ii ++ ){
        var k = ownMethods[ ii ];

        if( base.prototype[ k ] === callee ){
          found = true;
          break
        }
        //console.log( base.prototype.name, i, base.prototype[ k ] === args.callee );
      }; 
      if( found ) break;
    };
  }
    //console.log("Found in: ", base.prototype.name, k, i )

  // It needs to be found
  if( ! found ) throw new Error( "inheritedAsync coun't find method in chain" );

  // First element in the chain called `inherited`
  if( i - 1 < 0 ) return cb.call( this, null );

  var found = false;
  while( --i >= 0 ) {
    if( bases[ i ].prototype.hasOwnProperty( k ) ){
      found = true;
      break;
    }
  }

  // No inherited element in the chain, just call the callback
  if( ! found  ){
    if( type === 'async' ){
      return cb.call( this, null );            
    }
    if( type === 'sync' ){
      return;
    }
  }

  var fn = bases[ i ].prototype[ k ];

  // Call the function. It could be sync or async
  if( type == 'async' ){
    var argsMinusCallback = Array.prototype.slice.call(args, 0, -1 ).concat( cb )
    return fn ? fn.apply( this, argsMinusCallback ) : cb.call( this, null );
  } else {
    return fn ? fn.apply( this, args ) : undefined;
  }
};


var extend = function( SuperCtor, protoMixin ){

  // Only one argument was passed and it's an object: it's protoMixin.
  // So, just return declare with `this` as base class and protoMixin
  if( arguments.length === 1 ){

    if( typeof( SuperCtor ) === 'object' && SuperCtor !== null ) return declare( [ this ], SuperCtor );
    else protoMixin = {};
  }
  
  // SuperCtor is is either a constructor function, or an array of constructor functions
  // Make up finalSuperCtorArray according to it.
  var finalSuperCtorArray = [ this ];  
  if( Array.isArray( SuperCtor ) ){  
    SuperCtor.forEach( function( Ctor ){ finalSuperCtorArray.push( Ctor ); } );
  } else if( typeof( SuperCtor ) === 'function' ) {
    finalSuperCtorArray.push( SuperCtor );
  } else {
    throw new Error( "SuperCtor parameter illegal in declare (via extend)");
  }

  return declare( finalSuperCtorArray, protoMixin );
}


var instanceOf = function( What ){
  
  // Work out the bases where to search
  var bases = this.constructor.prototype.bases || workoutBases( this.constructor ); 

  // Search for a matching prototype
  for( var i = 0, l = bases.length; i < l; i ++ ){
    var base = bases[ i ];
    var originalConstructor = base.originalConstructor || base;
    if( What.prototype === originalConstructor.prototype ) return true;
  }

  return false;
}


var workoutBases = function( Ctor ){

  var bases = [];
  var current = Ctor.prototype;

  // The Ctor's prototype is added to start with
  bases.push( Ctor );

  // Add all entries in the prototype
  while( current = current.__proto__ ){
    bases.push( current.constructor );
  }
  return bases.reverse();
}

  
var makeConstructor = function( FromCtor, protoMixin ) {

  // The constructor that will get returned. It's basically a function
  // that calls the parent's constructor and then protoMixin.constructor.
  // It works with plain JS constructor functions (as long as they have,
  //  as they SHOULD, `prototype.constructor` set)
  var ReturnedCtor = function(){

    var base;

    // Run all _constructors in the right order
    var bases = this.__proto__.bases || workoutBases( this.constructor ); 

    // Run all of the init() functions in the base 
    for( var i = 0, l = bases.length; i < l; i ++ ){
      base = bases[ i ];
      if( base.prototype.hasOwnProperty('_constructor') ) {
        base.prototype._constructor.apply( this, arguments );
      }
    }
  };

  if( protoMixin === null ) protoMixin = {};
  if( typeof( protoMixin ) !== 'object' ) protoMixin = {};
  
  // Create the new function's prototype. It's a new object, which happens to
  // have its own prototype (__proto__) set as the superclass' prototype and the
  // `constructor` attribute set as FromCtor (the one we are about to return)

  ReturnedCtor.prototype = Object.create(FromCtor.prototype, {
    constructor: {
      value: ReturnedCtor,
      enumerable: false,
      writable: true,
      configurable: true
    },
  });

  // Copy every element in protoMixin into the prototype.
  // If constructor in protoMixin, then actually copy it as _constructor.
  // This is mainly for backwards compatibility.
  // It does an extra check to make sure it doesn't copy ReturnedCtor
  // twice (in case it's copying the prototype from another simpleDeclare constructor) 
  Object.getOwnPropertyNames( protoMixin ).forEach( function( k ){
    if( k !== 'constructor' ){
      ReturnedCtor.prototype[ k ] = protoMixin[ k ];
    } else {
      var j = k === 'constructor' ? '_constructor' : k;
      // There must be a better way of doing this. Really.
      if( protoMixin[ k ].toString() !== ReturnedCtor.toString() ) ReturnedCtor.prototype[ j ] =protoMixin[ k ];
    }

  });

  return ReturnedCtor;
}

var copyClassMethods = function( Source, Dest ){

  // Copy class methods over
  if( Source !== null ){
    Object.keys( Source ).forEach( function( property ) {
      if( property !== 'bases' && property !== 'super' ){
        Dest[ property ] = Source[ property ];
      }
    });
  }
}

var declare = function( SuperCtor, protoMixin ){
  
  var ResultClass;

  // Check that SuperCtor is the right type
  if( SuperCtor !== null && typeof( SuperCtor ) !== 'function' && !Array.isArray( SuperCtor ) ){
    throw new Error( "SuperCtor parameter illegal in declare");
  }

  // SuperCtor is null: the array will be an empty list
  if( SuperCtor === null ) SuperCtor = [];
  if( ! Array.isArray( SuperCtor ) ) SuperCtor = [ SuperCtor ];

  // Empty starting point
  //var MixedClass = BaseConstructor;
  var MixedClass = Object;

  // Enrich MixedClass inheriting from itself, adding SuperCtor.prototype and
  // adding class methods
  SuperCtor.forEach( function( SuperCtor ){
    var proto;

    proto = SuperCtor.prototype;
    var list = [];
    while( proto ){
      list.push( proto );
      proto = proto.__proto__;
    };
    list.reverse().forEach( function( proto ){

      var M = MixedClass;

      if( proto.constructor !== Object ){
        MixedClass = makeConstructor( MixedClass, proto );
        MixedClass.prototype.originalConstructor = proto.constructor.hasOwnProperty( 'originalConstructor' ) ? proto.constructor.originalConstructor : proto.constructor;

        copyClassMethods( M, MixedClass ); // Methods previously inherited
        copyClassMethods( proto.constructor, MixedClass ); // Extra methods from the father constructor
      }
    })

  });

  // Finally, inherit from the MixedClass, and add
  // class methods over
  var ResultClass = makeConstructor( MixedClass, protoMixin );
  ResultClass.originalConstructor = ResultClass;

  copyClassMethods( MixedClass, ResultClass );

  // Cache `bases`
  ResultClass.prototype.bases = workoutBases( ResultClass );

  // Add inherited() and inheritedAsync() to the prototype
  ResultClass.prototype.inherited = function( args ){
    inherited.call( this, 'sync', args );
  },
  ResultClass.prototype.inheritedAsync = function( args, cb ){
    inherited.call( this, 'async', args, cb );
  },
  ResultClass.prototype.instanceOf = instanceOf;

  // Add class-wide method `extend`
  ResultClass.extend = function( SuperCtor, protoMixin ){
    return extend.apply( this, arguments );
  }

  // That's it!
  return ResultClass;
};


// Returned extra: declarableObject
declare.declarableObject = declare( null );

// Returned extra: addBasesToPrototype
declare.addBasesToPrototype = function( Ctor ){
  Ctor.prototype.bases = workoutBases( Ctor )
}

exports = module.exports = declare;






function inspectProto( o ){
  var r = [];

  var p = o;
  var name = 'OBJ';
  while( p != null ){
      r.push( p );
    //});
    p = p.__proto__;
  }

  r.reverse().forEach( function( item ){
    console.log( "\nITEM:" , item.hasOwnProperty( 'name') ? item.name : 'UNKNOWN' );
    Object.getOwnPropertyNames( item ).forEach( function( k ){
      var output;
      var e = item[ k ];

      //if( typeof( e ) === 'function') output = e.toString();
      output = e && typeof( e ) === 'function' ? '[function]'  : e;
      console.log( k + ': ' + output);
    });

  });
}

/*

    // Create a BaseClass with a constructor, a method and a class method
    var BaseClass = declare( null, {

      // Define the constructor, will initialise `a`
      constructor: function( param ){

        console.log("BaseClass' constructor run");
        this.a = param; 
      },

      // Define a simple method, that will assign `b` and return 1000
      assignA: function( a ){
        console.log("AssignA run:", a );
        this.a = a;
        return 1000;
      },

      // Define an async method, which takes two parameters and
      // calls the callback with the sum of the values
      asyncMethod: function( p1, p2, done ){
        var t = p1 + p2;

        console.log("Original result of asyncMethod: " + t );

        done( null, t );
      },

    });

    // Defines a class method
    BaseClass.classMethod = function(){ 
      console.log("Class method actualy run");
    }

    console.log("\nCreating baseObject:");
    var baseObject = new BaseClass( 10 );
    
    console.log( "BASE OBJECT:");
    console.log( baseObject );

    var r = baseObject.assignA( 30 );
    console.log("baseObject.assignA returned:", r );

    console.log( "BASE OBJECT:");
    console.log( baseObject );

    baseObject.asyncMethod( 3, 4, function( err, res ){
      console.log("Result from async method: "  + res );

      // Running classMethod()
      BaseClass.classMethod();
    });


/*
console.log(".................................................");
console.log(".................................................");
console.log(".................................................");
console.log(".................................................");
*/

/*
   var Z1 = declare( null,{
     _constructor: function(){ console.log("Z1 Constructor called"); },
     name: 'Z1',
     mm1: function( param, cb ){
        console.log("Z1::mm", param );
        console.log( "Z1::mm is returning 100");
        cb( null, 100 );
      }
   });

   var Z2 = declare( null,{
    init: function(){ console.log("Z2 Constructor called"); },

    name: 'Z2',
    _constructor: function(){ console.log("Z2's constructor"); },

     mm2: function( param, cb ){
        console.log("Z2::mm", param );
        console.log( "Z2::mm is returning 101");
        cb( null, 101 );
      }
   });


   var Aa = declare( [ Z1, Z2 ], {
      constructor: function(){ console.log("Aa Constructor called"); },

      name: 'Aa',
      m: function( param, cb ){

        console.log("Aa::m", param );
        console.log( "Aa::m is returning 10");
        cb( null, 10 );
      },
    
    });


    // Note that B doesn't implement m()
    var Ba = declare( null, {
      _constructor: function(){ console.log("Ba Constructor called"); },

      name: 'Ba',
      m: function( param, cb ){
        console.log("Ba::m", param );
        this.inheritedAsync( arguments, function( err, res ){
          console.log( "Parent returned: ", res );
          console.log( "Ba::m is returning 11");
          cb( null, 11 );
        });
      }
    } );

    var Ca = declare( null, {
      _constructor: function(){ console.log("Ca Constructor called"); },
      name: 'Ca',
      m: function( param, cb ){
        console.log("Ca::m", param );
        this.inheritedAsync( arguments, function( err, res ){
          console.log( "Parent returned: ", res );
          console.log( "Ca::m is returning 12");
          cb( null, 12 );
        })
      }
    })

//    var a = new A();
//    var b = new B();
//    var c = new C();


var D = declare( [ Aa, Ba, Ca ], {
//var D = Aa.extend( [ Ba, Ca ], {

  _constructor: function(){
    console.log("D1 Constructor called");
  },

  name: 'D',
  m: function( param, cb ){
    console.log("D::m", param );
    this.inheritedAsync( arguments, function( err, res ){
      console.log( "Parent returned: ", res );

    })
    console.log( "D::m is returning 15");
    cb( null, 15 );
  },

});


debugger;

var d = new D();
d.name = "ME";
inspectProto( d );

console.log("TRUE?", d.instanceOf( Z1 ) ); 

console.log("RUNNING d.m():");
d.m( "pippo", function( err, res ){
  console.log("returned: ", res );
});

process.exit( 1 );
*/

/*

    var A = declare( null, {
      m: function( param ){

        console.log("A::m", param );
        console.log( "A::m is returning 10");
        return 10;
      },
      mm: function( param ){

        console.log("A::m", param );
        console.log( "A::m is returning 10");
        return 10;
      }

    });

    // Note that B doesn't implement m()
    var B = declare( [ A ] , {
      m: function( param ){
        console.log("B::m", param );
        console.log( "Parent returned: ", this.inherited( arguments) );
        console.log( "B::m is returning 11");
        return 11;
      }
    } );

    var C = declare( B, {
      m: function( param ){
        console.log("C::m", param );
        console.log( "Parent returned: ", this.inherited( arguments) );
        console.log( "C::m is returning 12");
        return 12;
      }
    })

//    var a = new A();
//    var b = new B();
//    var c = new C();


var D = declare([ A, B, C ]);
var d = new D();
console.log("RUNNING d.m():", d.m("pippo"));



console.log(".................................................");
console.log(".................................................");
console.log(".................................................");
console.log(".................................................");



console.log("Declare B1");
var B1 = declare( null, {

  name: 'B1',

  constructor: function(){
    console.log( "B1's constructor!") ;
  },

  m: function( parameter, cb ){
    console.log("B1 > m, parameter:", parameter );
    this.inheritedAsync( arguments, function( err, res ){
     console.log("RETURNED BY INHEDITEDASYNC (in B1): ", res );

      cb( null, 'Returned by B1' );
    });
  },

  mm: function( parameter){
    console.log("B1 > mm, parameter:", parameter );
  },
});

console.log("Declare B2");
var B2 = declare( null, {

  name: 'B2',

  constructor: function(){
    console.log( "B2's constructor!") ;
  },

  m: function( parameter, cb ){
    console.log("B2 > m, parameter: ", parameter );
    this.inheritedAsync( arguments, function( err, res ){

       console.log("RETURNED BY INHEDITEDASYNC (in B2): ", res );

      cb( null, 'Returned by B2' );
    });
  }
});

console.log("Declare B3");
var B3 = declare( null, {

  name: 'B3',
  constructor: function(){
    console.log( "B3's constructor!") ;
  },

  m: function( parameter, cb ){
    console.log("B3 > m, parameter: ", parameter );
    this.inheritedAsync( arguments, function( err, res ){

       console.log("RETURNED BY INHEDITEDASYNC (in B3): ", res );

      cb( null, 'Returned by B3' );
    });
  }
});


console.log( B1 );
console.log("DECLARING: D1" );
//var D1 = B1.extend( [ B2, B3 ], {
var D1 = declare( [ B1, B2, B3 ], {

  name: 'D1',

  constructor: function(){
    console.log( "D1's constructor!") ;
  },

  m: function( parameter, cb ){
    console.log("D1 > m, parameter:", parameter );
    this.inheritedAsync( arguments, function( err, res ){
     console.log("RETURNED IN INHEDITEDASYNC (in D1): ", res );

      cb( null, "Returned by D1");
    });
  },
})

console.log("Declaring D2");
var D2 = declare( [ D1 ] , {
  name: 'D2',

  m3: function(){
    console.log("D2 > m3!")
  },
  constructor: function(){
    console.log("D2?!?");
  },
})

console.log("D2 start:")
var d2 = new D2();
inspectProto( d2 );

console.log("D2 END:")


//var D = B.extend( [ A, A, A ] );

console.log("BEGIN");
var b1 = new B1();
var b2 = new B2();
var b3 = new B3();
console.log("END");


console.log("instanceof B1:", b1 instanceof( B1 ) );
console.log("RUNNING b1.m...");
b1.m( 'pippo', function( err, result ){
  console.log("b1.m WAS RUN!");
  console.log("Returned value:", result );


  var b2 = new B2();
  console.log("RUNNING b2.m...");
  b2.m( 'pluto', function( err, result ){
    console.log("b2.m WAS RUN!");
    console.log("Returned value:", result );


    var d1 = new D1();
    console.log("instanceof B2:", d1 instanceof( B2 ) );
    console.log("instanceof B3:", d1 instanceof( B3 ) );
    console.log("instanceof D1:", d1 instanceof( D1 ) );
    console.log("RUNNING d1.m...");
    d1.m('parameterToD1', function( err, res ){
      console.log("Ah, it did it!", res );


      d1.m( 'paperino', function( err, result ){
        console.log("d1.m WAS RUN!")
        console.log("Returned value:", result );
      });

    })

  });
});



    var A = declare( null, {
      m: function( param ){

        console.log("A::m", param );
        console.log( "A::m is returning 10");
        return 10;
      }
    });

    // Note that B doesn't implement m()
    var B = declare( A, {
      m: function( param ){
        console.log("B::m", param );
        console.log( this.inherited( arguments) );
        console.log( "B::m is returning 11");
        return 11;
      }
    } );

    var C = declare( B, {
      m: function( param ){
        console.log("C::m", param );
        console.log( this.inherited( arguments) );
        console.log( "C::m is returning 12");
        return 12;
      }
    })

    var a = new A();
    var b = new B();
    var c = new C();

    c.m = function( param ){
      console.log("c1::m", param );
      console.log( this.inherited( arguments) );
      console.log( "c1::m is returning 12");
      return 12;
    };

    c.m = function( param ){
      console.log("c2::m", param );
      console.log( this.inherited( arguments) );
      console.log( "c2::m is returning 12");
      return 12;
    };

    console.log("Calling a.m()" );
    console.log( "Returned: ", a.m('pippo' ) );

    console.log("Calling c.m()" );
    console.log( "Returned: ", c.m('pluto' ) );

    var Aa = declare( null, {
      m: function( param, cb ){
        console.log("Aa::m", param );
        cb( null, 10 );
      }
    });

    var Ba = declare( Aa, {
      m: function( param, cb  ){
        console.log("Ba::m", param );
        this.inheritedAsync( arguments, function( err, res ){
          console.log("Super returns:", res );

          cb( null, 11 );
        })
      }
    });


    var Ca = declare( Ba, {
      m: function( param, cb  ){
        console.log("Ca::m", param );
        this.inheritedAsync( arguments, function( err, res ){
          console.log("Super returns:", res );

          cb( null, 12 );
        })
      }
    });
    
    var aa = new Aa();
    var ba = new Ba();
    var ca = new Ca();

    console.log("Calling aa.m()" );
    aa.m('pippo', function( err, r ){
      console.log("Result from pippo: ", r );

      console.log("Calling ca.m()" );
      ca.m('pluto', function( err, r ){
        console.log("Result from pluto: ", r );

      });
    });



    // Create a BaseClass with a constructor, a method and a class method
    var BaseClass = declare( null, {

      // Define the constructor, will initialise `a`
      constructor: function( param ){

        console.log("BaseClass' constructor run");
        this.a = param; 
      },

      // Define a simple method, that will assign `b` and return 1000
      assignA: function( a ){
        this.a = a;
        return 1000;
      },

      // Define an async method, which takes two parameters and
      // calls the callback with the sum of the values
      asyncMethod: function( p1, p2, done ){
        var t = p1 + p2;

        console.log("Original result of asyncMethod: " + t );

        done( null, t );
      },

    });

    // Defines a class method
    BaseClass.classMethod = function(){ 
      console.log("Class method actualy run");
    }

    console.log("\nCreating baseObject:");
    var baseObject = new BaseClass( 10 );
    console.log( "BASE OBJECT:");
    console.log( baseObject );

    baseObject.asyncMethod( 3, 4, function( err, res ){
      console.log("Result from async method: "  + res );

      // Running classMethod()
      BaseClass.classMethod();
    });



    // Create a DerivedClass derived from BaseClass. It overloads the constructor
    // incrementing `a`. It also defines assignD()

    var DerivedClass = declare( BaseClass, {

      // Define the constructor. Note that this will be called _after_ BaseClass' constructor
      constructor: function( p ){

        console.log("DerivedClass' constructor run");
        this.a ++;
      },

     assignA: function assignA( a ){

        // Call the original `assignA` method.
        var r = this.inherited( arguments);
        console.log( "The inherited assignA() method returned: " + r );

        // Return something completely different
        return 20000;
     },

      // Define a new method to define `this.b`
      assignB: function( b ){
        this.b = b;
      },

      // Redefine BaseClass' `asyncMethod()` so that it considers `p1` twice
      // in the sum. To call the inherited async method, it uses `this.inheritedAsync()`
      asyncMethod: function asyncMethod( p1, p2, done ){
        this.inheritedAsync( arguments, function( err, res ){

          var newResult = res + p1;
          console.log("Returning this instead:", newResult );

          // Modifying what is returned by the original async method
          done( null, newResult );
        });
      },
    });

    console.log("\nCreating derivedObject:");
    var derivedObject = new DerivedClass( 20 );
    derivedObject.assignB( 40 );
    console.log( "DERIVED OBJECT:");
    console.log( derivedObject );
    DerivedClass.classMethod();

    console.log("\nAsync methods: ");

    // Async methods, main one and redefined one
    baseObject.asyncMethod( 3, 7, function( err, res ){
      if( err ){
        console.log("ERROR!", err );
      } else {
        console.log("Result of async method for baseObject:", res );

        console.log("Now calling asyncMethod for derived object...");

        derivedObject.asyncMethod( 3, 7, function( err, res ){
          if( err ){
            console.log("ERROR!", err );
          } else {
 
            console.log("Result of async method for derivedObject:", res );          }
        });
      }
    });




    // Create a Mixin class: a class that doesn't inherit from anything,
    // and just adds/redefines methods of the original class.

    var Mixin = declare( null, {

      // Define the constructor. Will change `a` even more
      constructor: function( p ){

        console.log("Mixin's constructor run");
        this.a = this.a + 47;
      },

      // Redefine the assignB method
      assignB: function( b ){

        console.log( "Running assignB within mixin..." );

        // Call the original `assignB` method. Note that the original
        // `assignB()` method will be called with a different parameter
        console.log("Calling the inherited assignB.")
        var r = this.inherited( arguments );
        console.log("Inherited assignB called, result:", r );

        this.b = 20000;
        console.log( "The inherited assignB() method returned: " + r );

        // Return b
        return this.b;
      },

      // Make up a new `assignC()` method
      assignC: function( c ){
        this.c = c;
      },
    });

    console.log("\nCreating mixedObject1:");
    var MixedClass1 = declare( [ BaseClass, Mixin ] );

    MixedClass1 = declare( [ MixedClass1, declare( null ), declare( null ) ]);


    var mixedObject1 = new MixedClass1( 10 );
    mixedObject1.assignB( 50 );
    MixedClass1.classMethod();
    console.log( "MIXED OBJECT 1 (WITH BASE):");
    console.log( mixedObject1 );

    console.log("\nCreating mixedObject2:");
    var MixedClass2 = declare( [ DerivedClass, Mixin ] );
    var mixedObject2 = new MixedClass2( 10 );
    mixedObject2.assignB( 50 );
    console.log( "MIXED OBJECT 2 (WITH DERIVED):");
    console.log( mixedObject2 );
    MixedClass2.classMethod();

    // DON'T! MixedClass3 inherits from MixedClass2 and Baseclass, but
    // MixedClass2 ALREADY inherits from Baseclass through DerivedClass!
    // Never inherits twice from the same class...
    // In this example, BaseClass' constructor in invoked TWICE.
     console.log("\nCreating mixedObject3 (the tangled one)")
    var MixedClass3 = declare( [ MixedClass2, BaseClass ] );
    var mixedObject3 = new MixedClass3( 10 );
    console.log( "MIXED OBJECT 3 (WITH TANGLED CLASSES):");
    console.log( mixedObject3 );

    MixedClass2.classMethod();



var A = declare( null, {

  constructor: function(){
    console.log("A's constructor called");
  },

  m1: function( arg ){
    console.log("A > m, argument: ", arg );

    var i = this.inherited( arguments);
    console.log("Received this from inherited called by A:", i );

    return 'Returned by A > m';
  }
});

var AA = declare( A, {
  m2: function(){
    console.log("AA > m2");

  }
})

var aa = new AA();
console.log("aa instanceof AA:", aa instanceof AA );
console.log("aa instanceof A:", aa instanceof A );

var B = declare( null, {

  constructor: function(){
    console.log("B's constructor called");
  },

  m1: function( arg ){
    console.log("B > m, argument: ", arg );

    var i = this.inherited( arguments);
    console.log("Received this from inherited called by B:", i );

    return 'Returned by B > m';
  }
});

var C = declare( null, {

  constructor: function(){
    console.log("C's constructor called");
  },

  m1: function( arg ){
    console.log("C > m, argument: ", arg );

    var i = this.inherited( arguments);
    console.log("Received this from inherited called by C:", i );

    return 'Returned by C > m';
  }
});


var ABC = declare( [A,B,C], {
  m1: function( arg ){
    console.log("ABC > m, argument: ", arg );

    var i = this.inherited( arguments);
    console.log("Received this from inherited called by ABC:", i );

    return 'Returned by ABC > m';
  }
} );

var abc = new ABC();
var r = abc.m1( 'pippo');
console.log("RESULT:", r );


*/