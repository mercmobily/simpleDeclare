"use strict";
/*
Copyright (C) 2015 Tony Mobily

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var async = require('async');

// Make up the baseConstructor. It will be used when `null` is passed
// as first parameter in `declare()`, so that every constructor class created
// will have `Class.extend()` as well as important methods in their prototypes
// (inheritedAsync, redefineMethod, etc.)

var BaseConstructor = function(){}

BaseConstructor.extend = function( SuperCtor, protoMixin ){

  // Only one argument was passed: it's protoMixin. So,
  // just return declare run with `this` as base class
  if( arguments.length === 1 ){
    var protoMixin = SuperCtor;
    return declare( this, protoMixin );
  }
  
  // Two arguments: the first one is either a constructor function,
  // or an array of constructor functions
  // Make up finalSuperCtorArray according to it.
  var finalSuperCtorArray = [ this ];  
  if( Array.isArray( SuperCtor ) ){  
    SuperCtor.forEach( function( Ctor ){ finalSuperCtorArray.push( Ctor ); } );
  } else {
    finalSuperCtorArray.push( SuperCtor );
  }

  return declare( finalSuperCtorArray, protoMixin );
}

// Important method that all objects created with simpleDeclare will implement
BaseConstructor.prototype = {

  inherited: function( method, args ){

    // Get the prototype of this object. The prototype will contain the superMap
    var p = Object.getPrototypeOf( this );

    // Get the right key for the superMap
    var fn = typeof( p.superMap ) === 'object' && p.superMap[ method ]; 

    if( fn ){
      return fn.apply( p, args );
    } else {
      return;
      //throw( new Error("Method  not inherited!") );
    }
  },

  inheritedAsync: function( method, args, cb ){
    var argsMinusCallback;

    // Get the prototype of this object. The prototype will contain the superMap
    var p = Object.getPrototypeOf( this );

    // Get the right key for the superMap
    var fn = typeof( p.superMap ) === 'object' && p.superMap[ method ]; 

    //console.log("******************IN inheritedAsync, super found:", fn );
    //console.log("SUPERMAP: ", this.superMap );

    if( fn ){
      argsMinusCallback = Array.prototype.slice.call(args, 0, -1 ).concat( cb )

      return fn.apply( p, argsMinusCallback );
    } else {
      return cb.apply( this );
      //throw( new Error("Method  not inherited!") );      
    }
  },

  // Redefine a method making sure that this.inherited will still work
  redefineMethod: function( methodName, newMethod ){
    declare.redefineMethod( this, methodName, newMethod );
  },

};


var makeConstructor = function( FromCtor, protoMixin ) {

  if( typeof( protoMixin ) === 'undefined' ) protoMixin = {};

  // The constructor that will get returned. It's basically a function
  // that calls the parent's constructor and then protoMixin.constructor.
  // It works with plain JS constructor functions (as long as they have,
  //  as they SHOULD, `prototype.constructor` set)
  var ReturnedCtor = function(){

    // Call the superclass constructor automatically
    if( typeof( FromCtor.prototype.constructor === 'function' ) ){
       FromCtor.prototype.constructor.apply( this, arguments );
    }

    // Call its own constuctor (kidnapped a second ago)
    if( typeof( protoMixin.constructor ) === 'function' ){
      protoMixin.constructor.apply( this, arguments );      
    }
    
  };

  // Create the new function's prototype. It's a new object, which happen to
  // have its own prototype (__proto__) set as the superclass' prototype and the
  // `constructor` attribute set as FromCtor (the one we are about to return)
  ReturnedCtor.super = FromCtor;
  ReturnedCtor.prototype = Object.create(FromCtor.prototype, {
    constructor: {
      value: ReturnedCtor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  ReturnedCtor.prototype.superMap = {};

  // Copy every element in protoMixin into the prototype.
  // Skips the methods "meaningful" to simpledeclare
  // (Copying superMap would be catatrophic since every object would end up with the same copy of superMap)
  for( var k in protoMixin ){
    if( [ 'superMap', 'constructor', 'inherited', 'inheritedAsync', 'redefineMethod' ].indexOf( k ) === -1 ){
      ReturnedCtor.prototype[ k ] = protoMixin[ k ];

      // Adds a reference to method.super() if FromCtor has it in its prototype
      if( typeof( protoMixin[ k ] ) === 'function' && FromCtor.prototype[k] ){
        ReturnedCtor.prototype.superMap[ protoMixin[ k ] ] = FromCtor.prototype[k];
      }
    }
  }
  return ReturnedCtor;
}

var copyClassMethods = function( Source, Dest ){

 // Copy class methods over
  if( Source !== null ){
    Object.keys( Source ).forEach( function( property ) {
      if( property !== 'super' && property !== 'superMap' ){
        Dest[ property ] = Source[ property ];
      }
    });
  }
}

var declare = function( SuperCtor, protoMixin ){

  // It's an array -- will make sure each SuperCtor
  // inherits from its parent's prototype before
  // finally creating the final class using protoMixin
  if( Array.isArray( SuperCtor ) ){

    // Empty starting point
    var MixedClass = BaseConstructor;

    // Enrich MixedClass inheriting from itself, adding SuperCtor.prototype and
    // adding class methods
    SuperCtor.forEach( function( SuperCtor ){
      var M = MixedClass;
      MixedClass = makeConstructor( MixedClass, SuperCtor.prototype );

      copyClassMethods( M, MixedClass ); // Methods previously inherited
      copyClassMethods( SuperCtor, MixedClass ); // Extra methods from SuperCtor
    });

    // Finally, inherit from the MixedClass, and add
    // class methods over
    var ResultClass = makeConstructor( MixedClass, protoMixin );
    copyClassMethods( MixedClass, ResultClass );
    return ResultClass;

  } else {
    if( SuperCtor == null || SuperCtor === undefined ) SuperCtor = BaseConstructor; 
    var ResultClass = makeConstructor( SuperCtor, protoMixin );
    copyClassMethods( SuperCtor, ResultClass );
    return ResultClass;

  }

};

declare.declarableObject = declare( null );

// Redefine a method making sure that this.inherited will still work
declare.redefineMethod = function( object, methodName, newMethod ){
  var originalMethod = object[ methodName ];
  object[ methodName ] = newMethod;
  var p = Object.getPrototypeOf( object );
  var oldSuper = p.superMap[ originalMethod ];
  delete p.superMap[ originalMethod ];
  p.superMap[ newMethod ] = oldSuper;
}


exports = module.exports = declare;

var B1 = declare( null, {

  constructor: function(){
    console.log( "B1's constructor!") ;
  },

  m: function m( parameter, cb ){
    console.log("B1 > m, parameter:", parameter );

    this.inheritedAsync( m, arguments, function(){
     console.log("ARGUMENTS RETURNED BY INHEDITEDASYNC (in B1): ", arguments );

      cb( null, 'Returned by B1' );
    });
  }
});


var B2 = declare( null, {

  constructor: function(){
    console.log( "B2's constructor!") ;
  },

  m: function m( parameter, cb ){
    console.log("B2 > m, parameter: ", parameter );
    this.inheritedAsync( m, arguments, function(){

       console.log("ARGUMENTS RETURNED BY INHEDITEDASYNC (in B2): ", arguments );

      cb( null, 'Returned by B2' );
    });
  }
});


var B3 = declare( null, {

  constructor: function(){
    console.log( "B3's constructor!") ;
  },

  m: function m( parameter, cb ){
    console.log("B3 > m, parameter: ", parameter );
    this.inheritedAsync( m, arguments, function(){

       console.log("ARGUMENTS RETURNED BY INHEDITEDASYNC (in B3): ", arguments );

      cb( null, 'Returned by B3' );
    });
  }
});


var D1 = B1.extend( [ B2, B3 ], {


//var D1 = declare( [ B1, B2, B3 ], {

  constructor: function(){
    console.log( "D1's constructor!") ;
  },

  m: function m( parameter, cb ){
    console.log("D1 > m");
    this.inheritedAsync( m, arguments, function(){
     console.log("ARGUMENTS RETURNED BY INHEDITEDASYNC (in D1): ", arguments );

      cb( null, "Returned by D1");
    });
  },
})


//var D = B.extend( [ A, A, A ] );


var b1 = new B1();
console.log("RUNNING b1.m...");
b1.m( 'pippo', function( err, result ){
  console.log("b1.m WAS RUN!");
  console.log("Returned value:", result );


  var b2 = new B2();
  console.log("RUNNING b2.m...");
  b2.m( 'pluto', function( err, result ){
    console.log("b2.m WAS RUN!");
    console.log("Returned value:", result );


    console.log("RUNNING d1.m...");
    var d1 = new D1();

    d1.redefineMethod( 'm', function m( parameter, cb ){
      console.log("REDEFINED D1 > m");
      this.inheritedAsync( m, arguments, function(){
       console.log("REDEFINED ARGUMENTS RETURNED BY INHEDITEDASYNC (in D1 REDEFINED): ", arguments );

        cb( null, "Returned by D1 REDEFINED ");
      });
    });



    d1.m( 'paperino', function( err, result ){
      console.log("d1.m WAS RUN!")
      console.log("Returned value:", result );
    });

  })
});




var A = declare( null, {

  constructor: function(){
    console.log("A's constructor called");
  },

  m1: function m1( arg ){
    console.log("A > m, argument: ", arg );

    var i = this.inherited(m1, arguments);
    console.log("Received this from inherited called by A:", i );

    return 'Returned by A';
  }
});

var B = declare( null, {

  constructor: function(){
    console.log("B's constructor called");
  },

  m1: function m1( arg ){
    console.log("B > m, argument: ", arg );

    var i = this.inherited(m1, arguments);
    console.log("Received this from inherited called by B:", i );

    return 'Returned by B';
  }
});

var C = declare( null, {

  constructor: function(){
    console.log("C's constructor called");
  },

  m1: function m1( arg ){
    console.log("C > m, argument: ", arg );

    var i = this.inherited(m1, arguments);
    console.log("Received this from inherited called by C:", i );

    return 'Returned by C';
  }
});


var ABC = declare( [A,B,C], {
  m1: function m1( arg ){
    console.log("ABC > m, argument: ", arg );

    var i = this.inherited(m1, arguments);
    console.log("Received this from inherited called by ABC:", i );

    return 'Returned by ABC';
  }
} );

var abc = new ABC();
var r = abc.m1( 'pippo');
console.log("RESULT:", r );



