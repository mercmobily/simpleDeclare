simpleDeclare
=============

This is a super-simplified implementation of `declare()`, which will help you create Javascript classes^H^H^H^H^H^Hconstructor functions while keeping you code neat.

simpleDeclare supports multiple inheritance, as well as class methods.


Here is a code snipset that shows 100% of its features:


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


* The function `this.inherited(arguments)` will call the constructor of the first matching class going up the chain, even if its direct parent doesn't implement that method. So, if class `A` defines `m()`, and class `B` inherits from `A`, and class `C` inherits from `B`, then `C` can call `this.inherited(arguments)` in `m()` and expect `A`'s `m()` to be called even if `B` doesn't implement `m()` at all. (You may need to read this sentence a couple of times before it makes perfect sense)

* You can inherit from "normal" classes not defined by `declare()`.

* Class methods are copied over from the parent to the child class. Parent methods are callable via `DerivedClass._super()`.

* Multiple inheritance is implemented by inheriting from each base class sequentially. Order matters.

# The problem it solves - little read for skeptics

Node.js provides a very basic function to implement classes that inherit from others: `util.inherits()`. This is hardly enough: code often ends up looking like this:

    function BaseClass( a ){
      this.a = a;
    }
    
    BaseClass.prototype.assignB = function(b){
      this.b = b;
    }
    
    function DerivedClass( a ){
    
      // Call the base class' constructor
      BaseClass.call( this, a );

      this.a ++;   
 
    }
    
    util.inherits( DerivedClass, BaseClass );
    
    DerivedClass.prototype.assignB = function( b ){
      BaseClass.prototype.assignB.call( this, b);
      this.b ++;
    }
    
    DerivedClass.prototype.assignC = function( c ){
      this.c = c;
    }

My problems with this code:

* It's unreadable. It's not clear, by reading it, what is what. It's easy enough here, but try to look at this code where there are several prototype functions and several inherited objects...

* The order in which you call `util.inherits()` matters -- a lot. You must remember to call it _before_ you define any custom prototypes

* Defining the prototype one by one by hand like that is hardly ideal

* You need to call the superclass' constructor by hand, manually

* If you want to call a parent's method from a child's method, you need to do so manually. If your parent doesn't implement that method, but the parent's parents do, you are out of luck.

* Multiple inheritance is... well, forget it.

* Mixin classes are... well, forget them.

The equivalent to the code above, which is also the example code provided, is:


    var BaseClass = declare( null, {

      constructor: function( a ){
        this.a = a;
      },

      assignB: function( b ){
        this.b = b;
      },
    });


    var DerivedClass = declare( BaseClass, {

      constructor: function( a ){
        this.a ++;
      },  

      assignB: function( b ){
        this.inherited( arguments );
        this.b ++;
      },

      assignC: function( c ){
        this.c = c;
      },

    });


Can you see the improvement? If so, you should use `simpleDeclare()`!


# LIMITATIONS:

Limitations won't be a problem if you keep things simple and don't mess with prototypes. Specifically:

  * If you change a method in a constructor's prototype, the `super` attribute of that method will be lost,
    and this.inherited(arguments) will no longer work

  * If you inherit from a class multiple times, well, the class will be inherited several times (no dupe
    checking)


