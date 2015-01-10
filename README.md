simpleDeclare
=============

SimpleDeclare is the Nirvana of OOP implementation in Javascript, working _with_ Javascript rather than against it. Highlights:

* Works with Javascript, as close to the metal as possible, with possibility to inherit from normal Javascript constructors
* Single inheritance and multiple inheritance (via Mixins)
* Strong implementation of `this.inherited()` (works the same way ECMA6 will eventually give us)
* Easy calling of asyncronous super methods with `this.inheritedAsync()`
* Automatic execution of all constructors in the right order
* Automatic inheritance of class-wide methods (they are copied over)
* `extend()` method available to extend specific constructors 
* Minimum amounts of meta-data, none of which is strictly necessary
* Fully unit-tested and currently used as the foundation in [Hotplate](https://github.com/mercmobily/hotplate) as most of Hotplate's foundation modules.

# Guide

## Simple inheritance from Object

````Javascript
    var A = declare( null, {
      method1: function( parameter ){
        console.log("A::method1() called!")
      },
    })

    var a = new A();

    console.log( A.prototype ); 
    /* =>
    { method1: [Function],
      inherited: [Function],
      inheritedAsync: [Function],
      instanceOf: [Function] }
    */

    a.method1(); // => A::method1() called!
    console.log( a.__proto__ === A.prototype ); // => true
    console.log( A.extend ); // => [Function]
````

This is the simplest way to create a constructor function: the first parameter, `null`, tells SimpleDeclare that you are inheriting from `Object()`. The second parameter contains the methods that will be added to the constructor's prototype.
You can ee that A's prototype also contains extra methods: `inherited()` and `inheritedAsync()` (which will call `method1()` of the parent) and `instanceOf()` (which checks if an object is the instance of a constructor, _including mixins_ -- more about this later).


## Simple inheritance from Object with constructor

````Javascript
    var A = declare( null, {
      method1: function( parameter ){
        console.log("A::method1() called!")
      },
      constructor: function( p ){
        console.log("A's constructor called with parameter: " + p )
      }
    })

    var a = new A( 10 ); // => A's constructor called with parameter: 10
    a.method1(); // => A::method1() called!
````

Here, a `constructor` attribute is passed: it will be called every time a new instance of A() is created. This is very handy to add initialisation code to your constructors.

## Simple inheritance from another constructor

````Javascript
    var A = declare( null, {

      name: 'A',

      constructor: function( p ){
        console.log("A's constructor called with parameter: " + p )
      },
 
      method1: function( parameter ){
        console.log("A::method1() called")
      },

      method2: function( parameter ){
        console.log("A::method2() called")
      },
    })

    var B = declare( A, {

      name: 'B',

      constructor: function( p ){
        console.log("B's constructor called with parameter: " + p )
      },
 
      method1: function( parameter ){
        console.log("B::method2() called");
      }
    })

    var a = new A( 10 ); // => A's constructor called with parameter: 10
    a.method1(); // => A::method1() called
    a.method2(); // => A::method2() called

    var b = new B( 11 );
    /* =>
    B's constructor called with parameter: 11
    A's constructor called with parameter: 11
    */

    b.method1(); // => B::method1() called

    console.log( a.__proto__ );
    /* =>
    { name: 'A',
      method1: [Function],
      method2: [Function],
      inherited: [Function],
      inheritedAsync: [Function],
      instanceOf: [Function] }
    */
    console.log( a.__proto__.__proto__ ); // => {}
    console.log( a.__proto__.__proto__.constructor === Object ); // true

    console.log( b.__proto__ ); // => { name: 'B', method1: [Function] }
    console.log( b.__proto__.__proto__ );
    /* =>
    { name: 'A',
      method1: [Function],
      method2: [Function],
      inherited: [Function],
      inheritedAsync: [Function],
      instanceOf: [Function] }
    */
    console.log( b.__proto__.__proto__.constructor === A ); // => true
    console.log( b.__proto__.__proto__.__proto__ ); // => {}
    console.log( b.__proto__.__proto__.__proto__.constructor === Object ); // => true 
````

Note that the attribute `name` is only here so that you can clearly recognise which prototype you're looking at. It has no special meaning for SimpleDeclare itself.

Also note that when running `new B()`, _both_ constructors are run, in the right order. This means that when you define a constructor with simpleDeclare you can rest assured that _every_ constructor function passed as `constructor` will actually be run.


## Simple inheritance from normal Javascript objects

````Javascript
  var A = function(){
    console.log("This is A's constructor!")
  }
  A.prototype.method1 = function(){
    console.log("method1() defined the good old Javascript way")
  }
````

````Javascript
````

````Javascript
````

````Javascript
````

Here is working code that shows 100% of SimpleDeclare's features:

### Requiring `simpledeclare`

    var declare = require('simpledeclare');

### Create a class/constructor function

Here is how you create a simple class/constructor function, with:

* A working `constructor()` that initialises `this.a`
* A method called `assignA()` that will assign `this.a` and return `1000`
* Another method called `asyncMethod()` that expects a callback as its last parameter, and will call it.
* A "class method" called `classMethod()`

Code:


````javascript
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
````

The first parameter of `declare()` is `null`, which means that the class won't be inherited from anything.

### Inheritance

You can obviously create classes/constructor functions based on other ones.

Here is the code for a constructor class with:

* The `BaseClass` class/constructor function as its "base class".
* A new constructor method. Note that _both_ the `BaseClass` and the `DerivedClass` constructors will be called, in the right order, when you use `DerivedClass` as a constructor. In this particular case, `this.a` is changed by `DerivedClass`' constructor.
* A redefined `assignA()` method, using `this.inherited()` to call the "original" `assignA` method. Note that in this example, it just prints out the original return value, and returns 2000. Also note that you need to pass the method's name to `this.inherited()`
* A new async method, called `asyncMethod()`, that will use `this.inheritedAsync()` to call `BaseClass`' original one
* `BaseClass`' class methods are copied over to `DerivedClass`. So, `classMethod()` is available in `DerivedClass` even though it was only defined in `BaseClass`. 

Code:


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
        var r = this.inherited(arguments);
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
      asyncMethod: function( p1, p2, done ){
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


A little mental puzzle about `this.inherited()`: The function `this.inherited( arguments )` will call the constructor of the first matching class going up the chain, even if its direct parent doesn't implement that method. So, if class `A` defines `m()`, and class `B` inherits from `A`, and class `C` inherits from `B`, then `C` can call `this.inherited( m, arguments)` in `m()` and expect `A`'s `m()` to be called even if `B` doesn't implement `m()` at all. (You may need to read this sentence a couple of times before it makes perfect sense)

Note that in this code `c.m()` will call both `C`'s `m()` _and_ `A`'s `m()`.

````javascript 
    var A = declare( null, {
      m: function(){
        console.log("A::m");
      }
    });

    // Note that B doesn't implement m()
    var B = declare( A );

    var C = declare( B, {
      m: function(){
        console.log("C::m, now calling inherited one:");
        this.inherited(arguments );
      }
    })

    var a = new A();
    var b = new B();
    var c = new C();

    console.log("Calling a.m()")
    a.m();
    console.log("Calling c.m()")
    c.m();
````

### Create a new mixin class/constructor function

Mixins are simple classes that are meant to "augment" another class. They are generic: you can use them to augment _any_ class.

Here is a mixin that:

* Once again defines a constructor that will change the value of `this.a`
* Redefines the `assignB()` method, using `this.inherited()` to call the "original" `assignB` method. Note that in this example `this.b` will be initialised to something different than the original method intended. This is what you get for "mixing in" with the wrong crowd!
* Defines a new `assignC()` method that defines `this.c`

Note how in order to mix in the `Mixin` class to `DerivedCass`, `declare()` is passed an array. When you do that, classes are "mixed in" together. It's important that you code Mixin properly: when you write a Mixin, you cannot actualy be sure what the class is inheriting from. See mixins as ways to extend existing classes in a generic way, or change the behaviour of specific methods in a class.

Also, note how simpledeclare doesn't check if a class has already been mixed in/inherited. So, you need to be careful not to inherit twice from the same class. The last bit of code in this example shows exactly what I mean.

Code:

    // Create a Mixin class: a class that doesn't inherit from anything,
    // and just adds/redefines methods of the original class.

    var Mixin = declare( null, {

      // Define the constructor. Will change `a` even more
      constructor: function( p ){

        console.log("Mixin's constructor run");
        this.a = this.a + 47;
      },

      // Redefine the assignB method
      assignB: function assignB( b ){

        console.log( "Running assignB within mixin..." );

        // Call the original `assignB` method. Note that the original
        // `assignB()` method will be called with a different parameter
        var r = this.inherited(arguments );
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

### Multiple inheritance

Multiple inheritance is a swearword in a lot of circles. However, "it has its uses". In this example, I create two base classes, and then create a third `MultipleClass` that inherits from both of them. You can see that:

* The constructor has been redefined, and a new parameter was added to it. This can only be done if you know _exactly_ the signature of every single constructor you are inheriting from
* The class methods are inherited too, so both ClassMethod an ClassMethod2 are available

Multiple inheritance is possible with simpledeclare but...

...but do use Mixins instead.

Code:

    // Create a BaseClass with a constructor, a method and a class method
    var BaseClass2 = declare( null, {

      // Define the constructor, will initialise `a`
      constructor: function( a, z ){

        console.log("BaseClass2' constructor run");
        this.z = z; 
      },

      // Define a simple method, that will assign `b` and return 1000
      assignZ: function( p ){
        this.z = p;
      },

    });

    // Defines a class method
    BaseClass2.classMethod2 = function(){ 
      console.log("Class method actualy run");
    }

    var MultipleClass = declare( [ BaseClass, BaseClass2 ], {
      constructor: function( p ){
        console.log("MultipleClass' constructor called, parameter: " + p );
      },

      assignAandZ: function( a, z ){
        this.assignA( a );
        this.assignZ( z );
      },

    });


    console.log("\nCreating derivedObject:");
    var multipleObject = new MultipleClass( 20, 30 );
    console.log( "DERIVED OBJECT after constructor:");
    console.log( multipleObject );
    multipleObject.assignA( 40 );
    multipleObject.assignZ( 60 );
    console.log( "DERIVED OBJECT after assignA and assignZ:");
    console.log( multipleObject );
    multipleObject.assignAandZ( 80, 100 );
    console.log( "DERIVED OBJECT after assignAandZ:");
    console.log( multipleObject );
    MultipleClass.classMethod();
    MultipleClass.classMethod2();



# The problem it solves - little read for skeptics

Node.js provides a very basic function to implement classes that inherit from others: `util.inherits()`. This is hardly enough: code often ends up looking like this:

    function BaseClass( p ){
      this.a = p;
    }
    
    BaseClass.prototype.assignB = function( p ){
      this.b = p;
    }
    
    function DerivedClass( p ){
    
      // Call the base class' constructor
      BaseClass.call( this, p );

      this.a ++; 
    }
    
    util.inherits( DerivedClass, BaseClass );
    
    DerivedClass.prototype.assignB = function( b ){
      BaseClass.prototype.assignB.call( this, b);
      this.b ++;
    }
    
    DerivedClass.prototype.assignC = function( p ){
      this.c = p;
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

      constructor: function( p ){
        this.a = a;
      },

      assignB: function( p ){
        this.b = p;
      },
    });


    var DerivedClass = declare( BaseClass, {

      constructor: function( p ){
        this.a ++;
      },  

      assignB: function assignB( p ){
        this.inherited(arguments );
        this.b ++;
      },

      assignC: function( p ){
        this.c = p;
      },

    });


Can you see the improvement? If so, you should use `simpleDeclare()`!


# LIMITATIONS:

Limitations won't be a problem if you keep things simple and don't mess with prototypes. Specifically:

  * If you change a method in a constructor's prototype, the `super` attribute of that method will be lost, and `this.inherited( methodReference, arguments)` will no longer work.
  * If you inherit from a class multiple times, well, the class will be inherited several times (no dupe checking). This affects constructors (which will be called several times), inherited methods, etc. Basically, don't inherit twice from the same class.


