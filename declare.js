

var declare = function( superCtor, protoMixin ){

  var innerDeclare = function(superCtor, protoMixin) {

    // Initial sanity checks
    if( typeof( superCtor ) !== 'function' && superCtor !== null ){
      throw( new Error("Parent class (superCtor) must be either a constructor function or null") );
    }
    if( typeof( protoMixin) !== 'object' ){
      throw( new Error("definition (protoMixin) must be an object") );
    }

    // Kidnap the `constructor` element from protoMixin, as this
    // it mustn't get copied over into the prototype
    var constructor = protoMixin.constructor;
    //delete protoMixin.constructor;

    // The function that will work as the effective constructor. This
    // will be returned
    var ctor = function(){

      // Call the superclass constructor automatically
      if( typeof( superCtor.prototype.constructor === 'function' ) ){
         superCtor.prototype.constructor.apply( this, arguments );
      }

      // Call its own constuctor (kidnapped a second ago)
      if( typeof( constructor ) === 'function' ){
        constructor.apply( this, arguments );
      }
    };

    // Grab the class methods from the parent class, and copy them
    // over to the newly created class.
    // If somebody deletes one of them, and then inherits from that constructor,
    // the child constructor won't have that method and won't be able to access
    // the parent's parent method automatically. But still, better than nothing
    if( superCtor !== null ){
      Object.keys( superCtor ).forEach( function( property ) { 
        ctor[ property ] = superCtor[ property ];      
      });
    }


    // The superclass can be either an empty one, or the one passed
    // as a parameter
    superCtor = superCtor === null ? function(){} : superCtor;

    // Create the new class' prototype. It's a new object, which happen to
    // have its own prototype (__proto__) set as the superclass' and the
    // `constructor` attribute set as ctor (the one we are about to return)
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
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
        if( typeof(  ctor.prototype[ k ] ) === 'function' && superCtor.prototype[k] ){
          ctor.prototype[ k ].super = superCtor.prototype[k];
        }
      }
    }

    return ctor;
  }

  // It's an array -- will make sure each superCtor
  // inherits from its parent's prototype before
  // finally creating the final class using protoMixin
  if( Array.isArray( superCtor ) ){

    var resultClass = function(){};
    superCtor.forEach( function( superCtor ){
      resultClass = innerDeclare( superCtor, {} );
    });
    return innerDeclare( resultClass, protoMixin );

  } else {
    return innerDeclare( superCtor, protoMixin );
  }


};

declare.mixin = function( Class, Mixin ){

  if( typeof( Mixin ) !== 'object' || Mixin === null ){
    throw( new Error("Mixin must be an object or an array") );
  }

  // It's a simple, single mixin: just return a constructor that
  // inherits from Class and uses Mixin
  if( ! Array.isArray( Mixin ) ){
    return declare( Class, Mixin );

  // It's an array: inherit N times, once per class
  } else {

    var ResultClass = Class;
    for( var k in Mixin ){
      ResultClass = declare( ResultClass, Mixin[ k ] );
    }
    return ResultClass;
  }

/*
  declare.mixin2 = function( Class, Mixin ){

  if( typeof( Mixin ) !== 'function' || Mixin === null ){
    throw( new Error("Mixin must be an object or an array") );
  }

  // It's a simple, single mixin: just return a constructor that
  // inherits from Class and uses Mixin
  if( ! Array.isArray( Mixin ) ){
    return declare( Class, Mixin );

  // It's an array: inherit N times, once per class
  } else {

    var ResultClass = Class;
    for( var k in Mixin ){
      ResultClass = declare( ResultClass, Mixin[ k ] );
    }
    return ResultClass;
  }
*/







/*
  var beforeMixin;
  for( var k in Mixin ){


    if( k !== 'constructor' ){

      beforeMixin = null;

      if( typeof( Class.prototype[ k ] ) === 'function' ){
        beforeMixin = Class.prototype[ k ];
      }

      Class.prototype[ k ] = Mixin[ k ];

      if( beforeMixin ){
        Class.prototype[ k ].super = beforeMixin;
      }

    }
  }

  if( typeof( Mixin.constructor ) !== 'undefined' ){
  
    console.log("THERE IS A CONSTRUCTOR");
//    var oldConstructor = Class;
//    Class = function(){
//      console.log("STUCAZZ");
//    }
//    Class.prototype.constructor = Class;
      return declare( Class, { constructor: Mixin.constructor } ); 
  }

  return Class;
  */  
}

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



console.log("Creating ABC.................................");

var ABC = declare( [A, B, C ], {

 methodOne: function(p){
  console.log("methodOne in ABC");
  console.log( p );
  console.log("Calling inherited() from ABC:");
  var a = this.inherited(arguments);
  console.log("In ABC -- Inherited function returned: " + a );
 },

});

var abc = new ABC( 3000 );
abc.methodOne(3001 );

ABC.runMe1();
ABC.runMe2();



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






var M1 = declare.mixin( A, Am );

var m1 = new M1(2000);
m1.methodOne(1);





