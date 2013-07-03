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

    // Create a BaseClass with a constructor, a method and a class method
    var BaseClass = declare( null, {

      constructor: function( a ){
        this.a = a; 
      },

      assignB: function( b ){
        this.b = b;
        return 1000;
      },
    });

    BaseClass.classMethod = function(){ 
      console.log("Class method");
    }


    // Create a DerivedClass derived from BaseClass. It overloads the constructor
    // incrementing `a`. It also defines assignD()
    var DerivedClass = declare( BaseClass, {

      constructor: function( a ){
        this.a ++;
      },

      assignD: function( d ){
        this.d = d;
      },

    });

    // Create a Mixin class, which redefines the constructor and
    // rerefined assignB (calling the 'inherited' one)
    var Mixin = declare( null, {
      constructor: function( a ){
        this.a = this.a + 47;
      },

      assignB: function( b ){
        console.log( "Running assignB within mixin..." );
        var r = this.inherited(arguments);
        console.log( "The inherited function returned: " + r );
      },

      assignC: function( c ){
        this.c = c;
      },

    });


    var baseObject = new BaseClass( 10 );
    console.log( "BASE OBJECT:");
    console.log( baseObject );

    var derivedObject = new DerivedClass( 20 );
    derivedObject.assignB( 40 );
    console.log( "DERIVED OBJECT:");
    console.log( derivedObject );
    DerivedClass.classMethod();

    var MixedClass1 = declare( [ BaseClass, Mixin ] );
    var mixedObject1 = new MixedClass1( 10 );
    mixedObject1.assignB( 50 );
    MixedClass1.classMethod();
    console.log( "MIXED OBJECT 1 (WITH BASE):");
    console.log( mixedObject1 );

    var MixedClass2 = declare( [ DerivedClass, Mixin ] );
    var mixedObject2 = new MixedClass2( 10 );
    console.log( "MIXED OBJECT 2 (WITH DERIVED):");
    console.log( mixedObject2 );
    MixedClass2.classMethod();

    // DON'T! MixedClass3 inherits from MixedClass2 and Baseclass, but
    // MixedClass2 ALREADY inherits from Baseclass through DerivedClass!
    // Never inherits twice from the same class...
    // It's easy enough to implement a table of hashes with already inherited
    // classes, but it wouldn't be "SIMPLEdeclare" anymore...
    // In this example, BaseClass' constructor in invoked TWICE.
    var MixedClass3 = declare( [ MixedClass2, BaseClass ] );
    var mixedObject3 = new MixedClass3( 10 );
    console.log( "MIXED OBJECT 3 (WITH TANGLED CLASSES):");
    console.log( mixedObject3 );
    MixedClass2.classMethod();

*/
