"use strict";
/*
Copyright (C) 2013 Tony Mobily

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var singleDeclare = function( SuperCtor, protoMixin ) {

  if( typeof( protoMixin ) === 'undefined' ) protoMixin = {};

  // Initial sanity checks
  if( typeof( SuperCtor ) !== 'function' && SuperCtor !== null && ! Array.isArray( SuperCtor ) ){
    throw( new Error("Parent class (SuperCtor) must be either a constructor function, an Array or null") );
  }
  if( typeof( protoMixin) !== 'object' ){
    throw( new Error("definition (protoMixin) must be an object") );
  }

  // Kidnap the `constructor` element from protoMixin, as this
  // it won't get manually copied over into the prototype
  var constructorFunction = protoMixin.constructor;

  // The function that will work as the effective constructor. This
  // will be returned
  var ctor = function(){

    // Call the superclass constructor automatically
    if( typeof( SuperCtor.prototype.constructor === 'function' ) ){
       SuperCtor.prototype.constructor.apply( this, arguments );
    }

    // Call its own constuctor (kidnapped a second ago)
    if( typeof( constructorFunction ) === 'function' ){
      constructorFunction.apply( this, arguments );
      
    }
  };

  // The superclass can be either the simple Object constructor, or the one passed
  // as a parameter
  SuperCtor = SuperCtor === null ? Object : SuperCtor;

  // Create the new class' prototype. It's a new object, which happen to
  // have its own prototype (__proto__) set as the superclass' and the
  // `constructor` attribute set as ctor (the one we are about to return)
  ctor.super_ = SuperCtor;
  ctor.prototype = Object.create(SuperCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  /*
  protoMixin.isInherited = function(  ){

    if( ! this.__proto__[ name ] ) return false;
    return !! this.__proto__[ name ].super;
  };
  */


  // Implement inherited() so that classes can run this.inherited(arguments)
  // the ones with super which maps the super-method
  protoMixin.inherited = function( method, args ){

    //var fn = this.__proto__[ name ].super;
    var fn = method.super;
    if( fn ){
      return fn.apply( this, args );
    } else {
      return;
      //throw( new Error("Method  not inherited!") );
    }
  },

  
  protoMixin.inheritedAsync = function( method, args, cb ){
    var argsMinusCallback;

    var fn = method.super;
    if( fn ){
      argsMinusCallback = Array.prototype.slice.call(args, 0, -1 ).concat( cb )

      return fn.apply( this, argsMinusCallback );
    } else {
      return cb.apply( this );
    }
  }

  // Copy every element in protoMixin into the prototype.
  for( var k in protoMixin ){
    if( k !== 'constructor' ){
      ctor.prototype[ k ] = protoMixin[ k ];
      if( typeof(  ctor.prototype[ k ] ) === 'function' && SuperCtor.prototype[k] ){
        ctor.prototype[ k ].super = SuperCtor.prototype[k];
      }
    }
  }

  return ctor;
}

var copyClassMethods = function( Source, Dest ){

 // Copy class methods over
  if( Source !== null ){
    Object.keys( Source ).forEach( function( property ) {
      if( property !== 'super_'){
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
    var MixedClass = null;

    // Enrich MixedClass inheriting from itself, adding SuperCtor.prototype and
    // adding class methods
    SuperCtor.forEach( function( SuperCtor ){
      var M = MixedClass;
      MixedClass = singleDeclare( MixedClass, SuperCtor.prototype );

      copyClassMethods( M, MixedClass ); // Methods previously inherited
      copyClassMethods( SuperCtor, MixedClass ); // Extra methods from SuperCtor

    });

    // Finally, inherit from the MixedClass, and add
    // class methods over
    ResultClass = singleDeclare( MixedClass, protoMixin );
    copyClassMethods( MixedClass, ResultClass );

    return ResultClass;

  } else {

    var ResultClass = singleDeclare( SuperCtor, protoMixin );
    copyClassMethods( SuperCtor, ResultClass );

    return ResultClass;

  }

};

exports = module.exports = declare;

/*
var A = declare( null, {

  m: function m( cb ){
    console.log("A > M");
    this.inheritedAsync( m, arguments, function(){
      cb( null );
    });
  }
});

var B = declare( null, {

  m1: function m( cb ){
    console.log("B > M");
    this.inheritedAsync( m, arguments, function(){
      cb( null );
    });
  }
});

var C = declare( null, {

  m: function m( cb ){
    console.log("C > M");
    this.inheritedAsync( m, arguments, function(){
      cb( null );
    });
  }
});


var ABC = declare([A,B,C]);

var abc = new ABC();
abc.m( function(){
  console.log("All finished");
});
*/
