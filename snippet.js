
    var declare = require('simpledeclare');

    // Create a BaseClass with a constructor, a method and a class method
    var BaseClass = declare( null, {

      // Define the constructor, will initialise `a`
      constructor: function( a ){

        console.log("BaseClass' constructor run");
        this.a = a; 
      },

      // Define a simple method, that will assign `b` and return 1000
      assignB: function( b ){
        this.b = b;
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


    // Create a DerivedClass derived from BaseClass. It overloads the constructor
    // incrementing `a`. It also defines assignD()

    var DerivedClass = declare( BaseClass, {

      // Define the constructor. Note that this will be called _after_ BaseClass' constructor
      constructor: function( a ){

        console.log("DerivedClass' constructor run");
        this.a ++;
      },

      // Define a new method to define `d`
      assignD: function( d ){
        this.d = d;
      },

      // Redefine BaseClass' `asyncMethod()` so that it considers `p1` twice
      // in the sum. To call the inherited async method, it uses `this.inheritedAsync()`
      asyncMethod: function( p1, p2, done ){
        this.inheritedAsync( 'asyncMethod', arguments, function( err, res ){

          // Modifying what is returned by the original async method
          done( null, res + p1 );
        });
      },

    });

    // Create a Mixin class: a class that doesn't inherit from anything,
    // and just adds/redefines methods of the original class. Great for drivers!

    var Mixin = declare( null, {

      // Define the constructor. Will change `a` even more
      constructor: function( a ){

        console.log("Mixin's constructor run");

        this.a = this.a + 47;
      },

      // Redefine the assignB method
      assignB: function( b ){

        console.log( "Running assignB within mixin..." );

        // Call the original `assignB` method. Note that `this.b` will
        // be changed by this method
        var r = this.inherited( 'assignB', arguments);

        console.log( "The inherited assignB() method returned: " + r );

        // Return something completely different
        return 20000;
      },

      // Make up a new `assignC()` method
      assignC: function( c ){
        this.c = c;
      },

    });

    console.log("\nCreating baseObject:");
    var baseObject = new BaseClass( 10 );
    console.log( "BASE OBJECT:");
    console.log( baseObject );

     console.log("\nCreating derivedObject:");
    var derivedObject = new DerivedClass( 20 );
    derivedObject.assignB( 40 );
    console.log( "DERIVED OBJECT:");
    console.log( derivedObject );
    DerivedClass.classMethod();

     console.log("\nCreating mixedObject1:");
    var MixedClass1 = declare( [ BaseClass, Mixin ] );
    var mixedObject1 = new MixedClass1( 10 );
    mixedObject1.assignB( 50 );
    MixedClass1.classMethod();
    console.log( "MIXED OBJECT 1 (WITH BASE):");
    console.log( mixedObject1 );

     console.log("\nCreating mixedObject2:");
    var MixedClass2 = declare( [ DerivedClass, Mixin ] );
    var mixedObject2 = new MixedClass2( 10 );
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

    console.log("\nAsync methods: ");

    // Async methods, main one and redefined one
    baseObject.asyncMethod( 3, 7, function( err, res ){
      if( err ){
        console.log("ERROR!");
        console.log( err );
      } else {
        console.log("Result of async method for baseObject:");
        console.log( res );

        derivedObject.asyncMethod( 3, 7, function( err, res ){
          if( err ){
            console.log("ERROR!");
            console.log( err );
          } else {
 
            console.log("Result of async method for derivedObject:");
            console.log( res );
          }
        });
      }
    });

