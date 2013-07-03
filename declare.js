var singleDeclare = function(SuperCtor, protoMixin) {

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

  // Implement inherited() so that classes can run this.inherited(arguments)
  // the ones with super which maps the super-method
  protoMixin.inherited = function(args){
    var name, fn;

      fn = args.callee.super;
      if( fn ){
        return fn.apply( this, args );
      } else {
        throw( new Error("Method " + name + "() not inherited!") );
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
        console.log("COPYING OVER: " + property );
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

// Some testing...


var A = declare( null, {
  methodOne: function(p){ 
    console.log("methodOne in A");
    console.log(p); 
    return 1000; 
  },
  methodTwo: function(p){ 
    console.log("methodTwo in A");
    console.log(p);
    return 1001; 
  },
  methodThree: function(p){ 
    console.log("methodThree in A");
    console.log(p);
    return 1002; 
  },
  constructor: function(a){ 
    this.a = a; 
    console.log("Constructor of A called");
  },
});


A.runMe1 = function(){
  console.log("A's runMe1!");
}


var B = declare( A, {
  methodOne: function( p ){
    console.log("methodOne in B"); 
    console.log( p );
    var a = this.inherited(arguments);
    console.log("In B -- Inherited function returned: " + a );
    return a;
  },
  constructor: function(a){ 
    console.log("Constructor of B called, and this.a is...");
    console.log( this.a );
  },
})

B.runMe2 = function(){
  console.log("B's runMe2!");
}


var C = declare( B, {
  methodTwo: function( p ){
    console.log("methodTwo in C"); 
    console.log( p );
    var a = this.inherited(arguments);
    console.log("In C -- Inherited function returned: " + a );
  },
  constructor: function(a){ 
    console.log("Constructor of C called, and this.a is...");
    console.log( this.a );
  },
})




console.log("Creating a...");
a = new A(10);
console.log("Creating b...");
b = new B( 20 );
console.log("Creating c...");
c = new C( 30 );

console.log( "a.a:")
console.log( a.a );
console.log( "b.a:")
console.log( b.a );
console.log( "c.a:")
console.log( c.a );


console.log("Creating DEF.................................");


D = declare( null, {
 methodOne: function(p){
    console.log("methodOne in D");
    console.log(p);
    return 1000;
  },
  methodTwo: function(p){
    console.log("methodTwo in D");
    console.log(p);
    return 1001;
  },

  constructor: function(a){ 
    this.a = a; 
    console.log("Constructor of D called");
  },



});
D.runMe1 = function(){
  console.log("D's runMe1!");
}


var E = declare( null, {
  methodOne: function( p ){
    console.log("methodOne in E"); 
    console.log( p );
    var a = this.inherited(arguments);
    console.log("In E -- Inherited function returned: " + a );
    return a;
  },
  constructor: function(a){ 
    console.log("Constructor of E called, and this.a is...");
    console.log( this.a );
  },
})

E.runMe2 = function(){
  console.log("E's runMe2!");
}

var F = declare( null, {
  methodOne: function( p ){
    console.log("methodOne in F"); 
    console.log( p );
    var a = this.inherited(arguments);
    console.log("In F -- Inherited function returned: " + a );
    return a;
  },
  constructor: function(a){ 
    console.log("Constructor of F called, and this.a is...");
    console.log( this.a );
  },
})


var DEF = declare( [D, E, F ], {

 methodOne: function(p){
  console.log("methodOne in DEF");
  console.log( p );
  console.log("Calling inherited() from DEF:");
  var a = this.inherited(arguments);
  console.log("In DEF -- Inherited function returned: " + a );
 },

});

var def = new DEF( 3000 );
def.methodOne(3001 );
console.log("INSTANCE OF:");
console.log( def instanceof DEF );

DEF.runMe1();
DEF.runMe2();



console.log( "a.methodOne(1):")
a.methodOne(1);
console.log( "a.methodTwo(2):")
a.methodTwo(2);

console.log( "b.methodOne(3):")
b.methodOne(3);
console.log( "b.methodTwo(4):")
b.methodTwo(4);

console.log( "c.methodOne(5):")
c.methodOne(5);
console.log( "c.methodTwo(6):")
c.methodTwo(6);


/*
console.log("MIXINS................");


var Am = { 
  methodOne: function( p ){
    console.log("methodOne in Am");
    console.log( p );
    a = this.inherited(arguments);
    console.log("In Am -- Inherited function returned: " + a );
  },
  constructor: function(a){
    console.log("Constructor of Am called, and this.a is...");
    console.log( this.a );
  },
};
*/

var Attempt = declare( null, { 
  methodOne: function( p ){
    console.log("methodOne in Attempt");
    console.log( p );
    a = this.inherited(arguments);
    console.log("In Attempt -- Inherited function returned: " + a );
  },
  constructor: function(a){
    console.log("Constructor of Attempt called, and this.a is...");
    console.log( this.a );
  },
});



/*


var M1 = declare.mixin( A, Am );

var m1 = new M1(2000);
m1.methodOne(1);

*/



